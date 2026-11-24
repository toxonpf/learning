import { createHash } from 'node:crypto';
import { DAY, asDate } from '../lib/dates.js';
import { asDay, minute } from './config.js';

const byId = (rows, key = 'id') => new Map(rows.map((row) => [row[key], row]));
const intersects = (a, b) => a.startMinute < b.endMinute && b.startMinute < a.endMinute;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true });
const MAX_MEETINGS = 700;
const MAX_CANDIDATES = 250_000;
class ModelLimit extends Error {}

function calendar({ startsOn, endsOn, config }) {
  const dates = [];
  for (let timestamp = +asDate(startsOn); timestamp <= +asDate(endsOn); timestamp += DAY) {
    const date = new Date(timestamp);
    const weekday = date.getUTCDay() || 7;
    if (config.workingDays.includes(weekday)) {
      dates.push({ day: asDay(date), weekday, week: asDay(new Date(timestamp - (weekday - 1) * DAY)) });
    }
  }
  return dates;
}

export function splitRoster(members, policy) {
  const ordered = [...members];
  const order = policy.order;
  if (order === 'random') {
    const keyed = new Map(ordered.map(({ id }) => [id, digest(`${policy.seed}/${id}`)]));
    ordered.sort((a, b) => keyed.get(a.id).localeCompare(keyed.get(b.id)) || a.id.localeCompare(b.id));
  } else {
    ordered.sort((a, b) => collator.compare(a[order] || '', b[order] || '') || a.id.localeCompare(b.id));
  }
  const ratios = policy.method === 'percent' ? policy.percentages.map((p) => p / 100) : Array(policy.count).fill(1 / policy.count);
  const exact = ratios.map((ratio) => ratio * ordered.length);
  const sizes = exact.map(Math.floor);
  const remainders = sizes.map((size, index) => ({ index, rest: exact[index] - size }));
  remainders.sort((a, b) => b.rest - a.rest || a.index - b.index);
  const remaining = ordered.length - sizes.reduce((sum, size) => sum + size, 0);
  for (const { index } of remainders.slice(0, remaining)) sizes[index] += 1;
  let first = 0;
  return sizes.map((size) => {
    const ids = ordered.slice(first, first + size).map(({ id }) => id);
    first += size;
    return new Set(ids);
  });
}

function compileGroups(input, dates) {
  const { groups, memberships } = input.source;
  const catalog = byId(groups);
  const membershipGroups = Map.groupBy(memberships, ({ groupId }) => groupId);
  return new Map(input.config.groups.map((settings) => {
    const group = catalog.get(settings.groupId);
    const roster = membershipGroups.get(group.id) ?? [];
    const indexed = byId(roster.map(({ user }) => user));
    const split = settings.split && splitRoster(indexed.values(), settings.split);
    const activeByDate = new Map(dates.map(({ day }) => [
      day, [...new Set(roster.filter(({ joinedOn, leftOn }) => joinedOn <= day && (!leftOn || day < leftOn))
        .map(({ user }) => user.id))],
    ]));
    return [group.id, { ...group, settings, split, activeByDate }];
  }));
}

function compileRooms({ rooms, roomTypes }) {
  const types = byId(roomTypes);
  return rooms.map((room) => {
    const features = new Map();
    for (const { featureId, quantity } of [...types.get(room.typeId)?.features ?? [], ...room.features]) {
      features.set(featureId, quantity);
    }
    return { ...room, quantities: features };
  });
}

function exceptionIndex(exceptions) {
  return Map.groupBy(exceptions.map((item) => ({
    ...item, startMinute: item.start ? minute(item.start) : 0, endMinute: item.end ? minute(item.end) : 1440,
  })), ({ scope, resourceId }) => `${scope}/${resourceId ?? ''}`);
}

function compileTask(requirement, groups, subgroup, name, input, candidatesFor) {
  const label = `${name} · ${groups.map(({ code }) => code).join(' + ')}${subgroup === null ? '' : ` / подгруппа ${subgroup + 1}`}`;
  const hours = input.config.academicMinutes * requirement.hoursPerMeeting;
  const task = {
    id: `${requirement.id}/${subgroup ?? 'whole'}`, subject: name, label, groups, subgroup,
    kind: requirement.kind, hours, duration: requirement.durationMinutes ?? hours, maxPerWeek: requirement.maxPerWeek,
    count: requirement.totalHours / requirement.hoursPerMeeting,
  };
  const { candidates, failure } = candidatesFor(task, requirement);
  return { ...task, candidates, failure };
}

function makeTasks(input) {
  const { config, source } = input;
  const dates = calendar(input);
  const groups = compileGroups(input, dates);
  const periods = byId(config.periods);
  const disciplines = byId(config.disciplines);
  const rooms = compileRooms(config);
  const teachers = byId(source.teachers);
  const index = exceptionIndex(config.exceptions);
  const slots = [...config.slots].sort((a, b) => a.start.localeCompare(b.start))
    .map(({ start, end }) => ({ start: minute(start), end: minute(end) }));
  let candidatesCount = 0;
  let meetings = 0;

  function isBlocked(scope, id, candidate) {
    return (index.get(`${scope}/${id}`) ?? []).some((exception) =>
      exception.from <= candidate.date && candidate.date <= exception.to && intersects(exception, candidate));
  }

  function candidatesFor(task, requirement) {
    meetings += task.count;
    if (meetings > MAX_MEETINGS) throw new ModelLimit('Слишком много занятий для одного запуска. Сократите учебный период или объём плана');
    const eligible = config.teachers.filter((teacher) =>
      teacher.disciplineIds.includes(requirement.disciplineId) &&
      (!requirement.teacherId || requirement.teacherId === teacher.userId) &&
      (teacher.groupMode === 'any' || requirement.groupIds.every((id) => teacher.groupIds.includes(id))) &&
      (!teacher.maxDailyMinutes || teacher.maxDailyMinutes >= task.hours) &&
      (!teacher.maxWeeklyMinutes || teacher.maxWeeklyMinutes >= task.hours));
    const suitableRooms = rooms.filter((room) =>
      (!requirement.roomTypeId || room.typeId === requirement.roomTypeId) &&
      (task.groups.length === 1 || room.jointGroups) &&
      requirement.features.every(({ featureId, quantity }) => (room.quantities.get(featureId) ?? 0) >= quantity));
    if (!eligible.length) return { candidates: [], failure: 'Нет подходящего преподавателя с разрешённым назначением и нагрузкой' };
    if (!suitableRooms.length) return { candidates: [], failure: 'Нет кабинета требуемого типа или оснащения' };
    const period = periods.get(requirement.periodId);
    const candidates = [];
    let hasRoster = false;
    let hasCapacity = false;
    for (const { day, weekday, week } of dates) {
      if (period && (day < period.from || day > period.to)) continue;
      const attendees = task.groups.map((group) => {
        const roster = group.activeByDate.get(day);
        const members = task.subgroup === null ? roster : roster.filter((id) => group.split[task.subgroup].has(id));
        return { group, members, roster };
      });
      if (attendees.some(({ group, members, roster }) =>
        !members.length || (group.settings.capacity && roster.length > group.settings.capacity))) continue;
      hasRoster = true;
      const studentIds = [...new Set(attendees.flatMap(({ members }) => members))];
      const availableRooms = suitableRooms.filter(({ capacity }) => capacity >= studentIds.length);
      if (!availableRooms.length) continue;
      hasCapacity = true;
      const groupLimits = attendees.flatMap(({ group, members }) =>
        group.settings.dailyLimit ? members.map((id) => ({
          key: `${group.id}/${id}/${day}`, limit: group.settings.dailyLimit,
        })) : []);
      for (const slot of slots) {
        const time = { date: day, startMinute: slot.start, endMinute: slot.start + task.duration };
        if (time.endMinute > slot.end || isBlocked('school', '', time)) continue;
        for (const teacher of eligible) {
          if (!teacher.weekdays.includes(weekday) || isBlocked('teacher', teacher.userId, time)) continue;
          for (const room of availableRooms) {
            if (isBlocked('room', room.id, time)) continue;
            candidatesCount += 1;
            if (candidatesCount > MAX_CANDIDATES) throw new ModelLimit('Слишком много вариантов. Сузьте период или задайте назначения преподавателей и требования к кабинетам');
            candidates.push({
              ...time, week, dayIndex: +asDate(day) / DAY, teacher, teacherId: teacher.userId, teacherName: teachers.get(teacher.userId).name,
              studentIds, groupIds: requirement.groupIds, groupLimits,
              roomId: room.id, room: room.name, subject: task.subject, kind: task.kind,
              audience: task.groups.map(({ code }) => code).join(' + ') + (task.subgroup === null ? '' : ` · подгруппа ${task.subgroup + 1}`),
              hours: task.hours, taskId: task.id, maxPerWeek: task.maxPerWeek,
            });
          }
        }
      }
    }
    const failure = !hasRoster ? 'Нет допустимого состава группы на даты занятий' :
      !hasCapacity ? 'Нет кабинета достаточной вместимости' : 'Нет подходящих свободных слотов в этом периоде';
    return { candidates, failure };
  }

  const tasks = config.requirements.flatMap((requirement) => {
    const audience = requirement.groupIds.map((id) => groups.get(id));
    const subgroups = requirement.split ? audience[0].split.map((_, index) => index) : [null];
    return subgroups.map((index) => compileTask(requirement, audience, index,
      disciplines.get(requirement.disciplineId).name, input, candidatesFor));
  });
  return { tasks, meetings };
}

function ledger() {
  const occupied = new Map();
  const load = new Map();
  const selected = [];
  const key = (event, suffix) => `${suffix}/${event.date}`;
  const resources = (event) => [
    key(event, 't/' + event.teacherId), key(event, 'r/' + event.roomId),
    ...event.studentIds.map((id) => key(event, 's/' + id)),
  ];
  const controls = (event) => [
    [key(event, 't/' + event.teacherId), event.hours, event.teacher.maxDailyMinutes],
    [`w/${event.teacherId}/${event.week}`, event.hours, event.teacher.maxWeeklyMinutes],
    [`p/${event.taskId}/${event.week}`, 1, event.maxPerWeek],
    [key(event, 'p/' + event.taskId), 1, null],
    ...event.groupLimits.map(({ key: id, limit }) => [id, limit.unit === 'lessons' ? 1 : event.hours, limit.value]),
  ];
  const fits = (event) => resources(event).every((id) => !(occupied.get(id) ?? []).some((other) => intersects(event, other))) &&
    controls(event).every(([id, amount, limit]) => !limit || (load.get(id) ?? 0) + amount <= limit);
  function add(event) {
    selected.push(event);
    for (const id of resources(event)) {
      const events = occupied.get(id) ?? [];
      events.push(event);
      occupied.set(id, events);
    }
    for (const [id, amount] of controls(event)) load.set(id, (load.get(id) ?? 0) + amount);
  }
  function remove(event) {
    selected.pop();
    for (const id of resources(event)) occupied.get(id).pop();
    for (const [id, amount] of controls(event)) load.set(id, load.get(id) - amount);
  }
  return { fits, add, remove, selected, dayCount: (event) => load.get(key(event, 'p/' + event.taskId)) ?? 0 };
}

function serialize(events) {
  return events.map(({ date, startMinute, endMinute, teacherId, teacherName, studentIds, groupIds, room, subject, kind, audience }) =>
    ({ date, startMinute, endMinute, teacherId, teacherName, studentIds, groupIds, room, subject, kind, audience }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute || a.audience.localeCompare(b.audience));
}

export function solveSchedule(input, { milliseconds = 2200, branchLimit = 65_000 } = {}) {
  if (!input.config.requirements.length) return { state: 'invalid', diagnostics: ['Добавьте строки учебного плана'], meetings: 0, events: [] };
  let model;
  try {
    model = makeTasks(input);
  } catch (error) {
    if (!(error instanceof ModelLimit)) throw error;
    return { state: 'limit', diagnostics: [error.message], meetings: 0, events: [] };
  }
  const { tasks, meetings } = model;
  const diagnostics = tasks.filter(({ candidates }) => !candidates.length)
    .slice(0, 20).map(({ label, failure }) => `${label}. ${failure}`);
  if (diagnostics.length) return { state: 'infeasible', diagnostics, meetings, events: [] };
  const sorted = tasks.sort((a, b) => a.candidates.length / a.count - b.candidates.length / b.count || a.id.localeCompare(b.id));
  const deadline = performance.now() + milliseconds;
  const answer = (events) => ({ state: 'feasible', diagnostics: [], meetings, events: serialize(events) });
  const quick = ledger();
  let greedyFailed = false;
  for (const task of sorted) {
    for (let occurrence = 0; occurrence < task.count; occurrence += 1) {
      let best = null;
      let score = Infinity;
      const target = task.candidates[Math.floor(((occurrence + 0.5) / task.count) * task.candidates.length)].dayIndex;
      for (const candidate of task.candidates) {
        const cost = quick.dayCount(candidate) * 900 + Math.abs(candidate.dayIndex - target);
        if (cost < score && quick.fits(candidate)) {
          score = cost;
          best = candidate;
          if (!cost) break;
        }
      }
      if (!best || performance.now() > deadline) { greedyFailed = true; break; }
      quick.add(best);
    }
    if (greedyFailed) break;
  }
  if (!greedyFailed) return answer(quick.selected);

  const exact = ledger();
  let branches = 0;
  let limited = false;
  function search(taskIndex, count, start) {
    if (taskIndex === sorted.length) return true;
    const task = sorted[taskIndex];
    if (count === task.count) return search(taskIndex + 1, 0, 0);
    for (let i = start; i <= task.candidates.length - (task.count - count); i += 1) {
      if (++branches > branchLimit || performance.now() > deadline) { limited = true; return false; }
      const event = task.candidates[i];
      if (!exact.fits(event)) continue;
      exact.add(event);
      if (search(taskIndex, count + 1, i + 1)) return true;
      exact.remove(event);
      if (limited) return false;
    }
    return false;
  }
  if (search(0, 0, 0)) return answer(exact.selected);
  return {
    state: limited ? 'limit' : 'infeasible', meetings, events: [],
    diagnostics: [limited ? 'Поиск достиг лимита. Сузьте период или добавьте доступные слоты и кабинеты.' :
      'Нельзя разместить все занятия одновременно. Проверьте лимиты нагрузки, доступность преподавателей и кабинетов.'],
  };
}
