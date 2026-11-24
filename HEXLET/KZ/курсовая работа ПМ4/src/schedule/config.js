import { z } from 'zod';
import { DAY, asDate, isoDay } from '../lib/dates.js';
import { HttpError } from '../lib/http.js';
import { startTime, text, uuid } from '../lib/validation.js';

export const PLAN_DAYS = 185;
export const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
export const asDay = (date) => date.toISOString().slice(0, 10);
export const minute = (clock) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
const int = (min, max) => z.number().int().min(min).max(max);
const ids = (max) => z.array(uuid).max(max);
const weekdays = z.array(int(1, 7)).max(7);
const timeWindow = z.strictObject({ start: startTime, end: startTime });
const dateWindow = { from: isoDay, to: isoDay };
const idName = { id: uuid, name: text(120) };
const featureQuantities = (minimum = 1) => z.array(z.strictObject({ featureId: uuid, quantity: int(minimum, 10000) })).max(80);
const quantities = featureQuantities();
const limits = z.strictObject({ unit: z.enum(['lessons', 'minutes']), value: int(1, 1440) });

const partition = z.strictObject({
  count: int(2, 12),
  order: z.enum(['random', 'firstName', 'lastName', 'patronymic', 'id']),
  method: z.enum(['balanced', 'percent']),
  percentages: z.array(int(1, 100)).max(12),
  seed: text(60),
});

export const configSchema = z.strictObject({
  academicMinutes: int(1, 120),
  workingDays: weekdays.min(1),
  slots: z.array(timeWindow).min(1).max(24),
  periods: z.array(z.strictObject({ ...idName, ...dateWindow })).max(24),
  exceptions: z.array(z.strictObject({
    ...idName, ...dateWindow, scope: z.enum(['school', 'teacher', 'room']),
    resourceId: uuid.nullable(), start: startTime.nullable(), end: startTime.nullable(),
  })).max(400),
  disciplines: z.array(z.strictObject(idName)).max(250),
  features: z.array(z.strictObject(idName)).max(100),
  roomTypes: z.array(z.strictObject({ ...idName, features: quantities })).max(80),
  rooms: z.array(z.strictObject({
    ...idName, capacity: int(1, 10000), typeId: uuid.nullable(), jointGroups: z.boolean(), features: featureQuantities(0),
  })).max(250),
  teachers: z.array(z.strictObject({
    userId: uuid, disciplineIds: ids(250).min(1), weekdays: weekdays.min(1),
    maxDailyMinutes: int(1, 1440).nullable(), maxWeeklyMinutes: int(1, 10080).nullable(),
    groupMode: z.enum(['any', 'only']), groupIds: ids(250),
  })).max(250),
  groups: z.array(z.strictObject({
    groupId: uuid, studyYear: int(1, 20).nullable(), capacity: int(1, 10000).nullable(),
    dailyLimit: limits.nullable(), split: partition.nullable(),
  })).max(250),
  requirements: z.array(z.strictObject({
    id: uuid, disciplineId: uuid, kind: text(48), groupIds: ids(4).min(1), split: z.boolean(), periodId: uuid.nullable(),
    totalHours: int(1, 1000), hoursPerMeeting: int(1, 12), durationMinutes: int(1, 600).nullable(),
    maxPerWeek: int(1, 100).nullable(), teacherId: uuid.nullable(),
    roomTypeId: uuid.nullable(), features: quantities,
  })).max(500),
});

export const startPlan = z.strictObject({ name: text(120), startsOn: isoDay, endsOn: isoDay });
export const createPlanRequest = startPlan.extend({ sourceId: uuid.optional() });
export const planUpdate = startPlan.extend({ revision: int(1, 2147483646), config: configSchema });
export const generationRequest = z.strictObject({ revision: int(1, 2147483646) });
export const publishRequest = generationRequest.extend({ draftId: uuid });
export const profileUpdate = z.strictObject({
  firstName: text(80).nullable(), lastName: text(80).nullable(), patronymic: text(80).nullable(),
});

export function newConfig() {
  return {
    academicMinutes: 45, workingDays: [1, 2, 3, 4, 5],
    slots: [
      { start: '08:30', end: '10:00' }, { start: '10:15', end: '11:45' },
      { start: '12:15', end: '13:45' }, { start: '14:00', end: '15:30' },
    ],
    periods: [], exceptions: [], disciplines: [], features: [], roomTypes: [], rooms: [],
    teachers: [], groups: [], requirements: [],
  };
}

function ensure(condition, message) {
  if (!condition) throw new HttpError(400, message);
}

export function validateRange(from, to, limit = PLAN_DAYS) {
  ensure(from <= to && asDate(to) - asDate(from) < limit * DAY, `Допустимый диапазон — от 1 до ${limit} дней`);
}

function unique(items, message) {
  ensure(new Set(items).size === items.length, message);
}

const hasAll = (values, lookup) => values.every((value) => lookup.has(value));
const indexBy = (items, key) => new Map(items.map((item) => [item[key], item]));

export function validateConfig({ startsOn, endsOn, config }, { groups, teachers }) {
  validateRange(startsOn, endsOn);
  const indexes = {
    periods: indexBy(config.periods, 'id'), exceptions: indexBy(config.exceptions, 'id'),
    disciplines: indexBy(config.disciplines, 'id'), features: indexBy(config.features, 'id'),
    roomTypes: indexBy(config.roomTypes, 'id'), rooms: indexBy(config.rooms, 'id'),
    teachers: indexBy(config.teachers, 'userId'), groups: indexBy(config.groups, 'groupId'),
    requirements: indexBy(config.requirements, 'id'),
  };
  for (const [name, index] of Object.entries(indexes)) {
    ensure(index.size === config[name].length, 'В настройках повторяются записи');
  }
  unique(config.rooms.map(({ name }) => name.toLocaleLowerCase('ru')), 'Названия кабинетов должны отличаться');
  unique(config.disciplines.map(({ name }) => name.toLocaleLowerCase('ru')), 'Названия дисциплин должны отличаться');
  unique(config.workingDays, 'Рабочие дни повторяются');
  const slots = [...config.slots].sort((a, b) => a.start.localeCompare(b.start));
  ensure(slots.every((slot, i) => slot.start < slot.end && (!i || slots[i - 1].end <= slot.start)),
    'Слоты должны иметь положительную длительность и не пересекаться');
  const insidePlan = (item) => startsOn <= item.from && item.from <= item.to && item.to <= endsOn;
  ensure(config.periods.every(insidePlan), 'Даты каждого модуля должны входить в учебный период');
  const liveTeachers = indexBy(teachers, 'id');
  const liveGroups = indexBy(groups, 'id');
  const checkFeatures = (features) => {
    const selected = features.map(({ featureId }) => featureId);
    unique(selected, 'Оснащение повторяется');
    ensure(hasAll(selected, indexes.features), 'Сначала добавьте указанное оснащение в справочник');
  };
  for (const type of config.roomTypes) checkFeatures(type.features);
  for (const room of config.rooms) {
    ensure(!room.typeId || indexes.roomTypes.has(room.typeId), `Проверьте тип кабинета «${room.name}»`);
    checkFeatures(room.features);
  }
  for (const group of config.groups) {
    ensure(liveGroups.has(group.groupId), 'Группа отсутствует или находится в архиве');
    if (group.split?.method === 'percent') {
      const { percentages, count } = group.split;
      ensure(percentages.length === count && percentages.reduce((sum, value) => sum + value, 0) === 100,
        'Укажите по одной доле на подгруппу. Сумма должна быть 100%');
    }
  }
  for (const teacher of config.teachers) {
    ensure(liveTeachers.has(teacher.userId), 'Проверьте роль преподавателя');
    ensure(hasAll(teacher.disciplineIds, indexes.disciplines), 'Дисциплина преподавателя отсутствует в справочнике');
    ensure(hasAll(teacher.groupIds, liveGroups), 'Привязанная группа отсутствует или находится в архиве');
    ensure(teacher.groupMode === 'any' || teacher.groupIds.length, 'Укажите группы с разрешённым назначением');
    for (const values of [teacher.disciplineIds, teacher.groupIds, teacher.weekdays]) {
      unique(values, 'Настройки преподавателя содержат повторяющиеся значения');
    }
  }
  for (const exception of config.exceptions) {
    ensure(insidePlan(exception), 'Даты исключения должны входить в учебный период');
    ensure((!exception.start && !exception.end) || (exception.start && exception.end && exception.start < exception.end),
      'Укажите начало и конец исключения или оставьте оба поля пустыми');
    if (exception.scope === 'school') ensure(exception.resourceId === null, 'Для общего выходного ресурс не выбирается');
    if (exception.scope === 'teacher') ensure(liveTeachers.has(exception.resourceId), 'Выберите преподавателя для исключения');
    if (exception.scope === 'room') ensure(indexes.rooms.has(exception.resourceId), 'Выберите кабинет для исключения');
  }
  for (const requirement of config.requirements) {
    unique(requirement.groupIds, 'Группы учебной нагрузки повторяются');
    ensure(hasAll(requirement.groupIds, indexes.groups), 'Сначала добавьте группу в настройки плана');
    ensure(indexes.disciplines.has(requirement.disciplineId), 'Дисциплина отсутствует в справочнике');
    ensure(!requirement.periodId || indexes.periods.has(requirement.periodId), 'Модуль учебного периода отсутствует');
    ensure(!requirement.roomTypeId || indexes.roomTypes.has(requirement.roomTypeId), 'Тип кабинета отсутствует');
    ensure(requirement.totalHours % requirement.hoursPerMeeting === 0,
      'Количество академических часов должно делиться на часы одного занятия');
    ensure(!requirement.split || (requirement.groupIds.length === 1 && indexes.groups.get(requirement.groupIds[0]).split),
      'Для занятия по подгруппам выберите одну группу с настроенным делением');
    const teacher = indexes.teachers.get(requirement.teacherId);
    ensure(!requirement.teacherId || (teacher && teacher.disciplineIds.includes(requirement.disciplineId)),
      'Закреплённый преподаватель должен вести указанную дисциплину');
    checkFeatures(requirement.features);
  }
}
