import { z } from 'zod';
import { isoDay } from '../lib/dates.js';
import { read, send } from '../lib/http.js';
import { changes, startTime, text, uuid, uuidParams } from '../lib/validation.js';
import * as marks from '../services/attendance.js';
import * as lessons from '../services/lessons.js';

const lessonFields = { title: text(120), startTime };
const lessonBody = z.strictObject({ ...lessonFields, date: isoDay });
const lessonChanges = changes(lessonFields);
const statusFields = {
  name: text(60),
  code: text(6).toUpperCase().pipe(z.string().max(6).regex(/^[\p{L}\p{N}+-]+$/u)),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).toLowerCase(),
  countsAsPresent: z.boolean(),
};
const statusBody = z.strictObject({ ...statusFields, countsAsPresent: z.boolean().default(false) });
const statusChanges = changes({ ...statusFields, archived: z.boolean() });
const note = z.string().trim().max(500).transform((value) => value || null).nullable();
const markFields = { statusId: uuid, note };
const markBody = z.strictObject({ ...markFields, lessonId: uuid, studentId: uuid, note: note.optional() });
const markChanges = changes(markFields);
const fillBody = z.strictObject({ statusId: uuid });
const markQuery = z.strictObject({ lessonId: uuid });

export function attendanceController(db) {
  return {
    list: async (req, res) => {
      const { lessonId } = read(markQuery, req.query);
      send(res, await marks.listMarks(db, lessonId, req.user, req.today));
    },
    get: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await marks.getMark(db, id, req.user, req.today));
    },
    create: async (req, res) => {
      send(res, await marks.createMark(db, req.user, req.today, read(markBody, req.body)), 201);
    },
    update: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await marks.updateMark(db, id, req.user, req.today, read(markChanges, req.body)));
    },
    remove: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await marks.deleteMark(db, id, req.user, req.today));
    },
    fill: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      const { statusId } = read(fillBody, req.body);
      send(res, await marks.fillUnmarked(db, id, req.user, req.today, statusId));
    },
    lesson: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await lessons.requireLesson(db, id, req.user, req.today));
    },
    createLesson: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await lessons.createLesson(db, id, req.user, req.today, read(lessonBody, req.body)), 201);
    },
    updateLesson: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await lessons.updateLesson(db, id, req.user, req.today, read(lessonChanges, req.body)));
    },
    removeLesson: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await lessons.deleteLesson(db, id, req.user, req.today));
    },
    statuses: async (req, res) => send(res, await marks.listStatuses(db)),
    createStatus: async (req, res) => send(res, await marks.createStatus(db, read(statusBody, req.body)), 201),
    updateStatus: async (req, res) => {
      const { id } = read(uuidParams, req.params);
      send(res, await marks.updateStatus(db, id, read(statusChanges, req.body)));
    },
  };
}
