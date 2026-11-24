import { z } from 'zod';
import { asDate, DAY, isoDay } from '../lib/dates.js';
import { HttpError, read, send } from '../lib/http.js';
import { changes, text, uuid, uuidParams } from '../lib/validation.js';
import * as groups from '../services/groups.js';

const groupFields = {
  code: text(32).toUpperCase().pipe(z.string().max(32).regex(/^[\p{L}\p{N}][\p{L}\p{N} ./_-]*$/u)),
  name: text(120),
};
const groupBody = z.strictObject(groupFields);
const groupChanges = changes({ ...groupFields, archived: z.boolean() });
const journalQuery = z.strictObject({ from: isoDay, to: isoDay });
const memberBody = z.strictObject({ userId: uuid, joinedOn: isoDay, leftOn: isoDay.nullable().optional() });
const memberChanges = z.strictObject({ leftOn: isoDay.nullable() });
const memberParams = z.object({ id: uuid, memberId: uuid });
const accountRole = z.enum(['user', 'teacher']);
const userQuery = z.strictObject({ q: z.string().trim().max(120).default(''), role: accountRole.optional() });
const roleBody = z.strictObject({ role: accountRole });

export function groupController(db) {
  return {
    list: async (req, res) => send(res, await groups.listGroups(db, req.user, req.today)),
    create: async (req, res) => send(res, await groups.createGroup(db, read(groupBody, req.body)), 201),
    update: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await groups.updateGroup(db, id, read(groupChanges, req.body)));
    },
    journal: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      const range = read(journalQuery, req.query);
      const [from, to] = [asDate(range.from), asDate(range.to)];
      if (to < from || to - from >= 31 * DAY) throw new HttpError(400, 'Укажите период от 1 до 31 дня');
      send(res, await groups.getJournal(db, id, req.user, req.today, from, to));
    },
    members: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await groups.listMembers(db, id, req.user, req.today));
    },
    addMember: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await groups.addMember(db, id, req.user, req.today, read(memberBody, req.body)), 201);
    },
    updateMember: async (req, res) => {
      const { id, memberId } = read(memberParams, req.params);
      send(res, await groups.updateMember(db, id, memberId, req.user, req.today, read(memberChanges, req.body)));
    },
    users: async (req, res) => send(res, await groups.listUsers(db, read(userQuery, req.query))),
    updateRole: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      const { role } = read(roleBody, req.body);
      send(res, await groups.updateUserRole(db, id, role));
    },
  };
}
