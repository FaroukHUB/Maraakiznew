import { relations } from "drizzle-orm";

// ─── Re-exports ──────────────────────────────────────────

export { users, userRoleEnum } from "./users";
export {
  studentProfiles,
  arabicReadingLevelEnum,
} from "./student-profiles";
export { programs } from "./programs";
export {
  subscriptions,
  sessionTypeEnum,
  subscriptionStatusEnum,
  closureReasonEnum,
} from "./subscriptions";
export {
  sessions,
  sessionParticipants,
  sessionStatusEnum,
  attendanceStatusEnum,
  CONSUMING_STATUSES,
  ATTENDED_STATUSES,
  MISSED_STATUSES,
  RATED_STATUSES,
} from "./sessions";
export { groups, groupMembers, groupStatusEnum } from "./groups";
export { skills, skillProgress, skillStatusEnum, ACQUIRED_STATUS } from "./skills";
export {
  sessionNotes,
  sessionResources,
  sessionResourceTypeEnum,
  resourceVisibilityEnum,
} from "./session-notes";
export { resources, resourceTypeEnum } from "./resources";
export {
  payments,
  paymentMethodEnum,
  paymentStatusEnum,
} from "./payments";

// ─── Imports for relations ───────────────────────────────

import { users } from "./users";
import { studentProfiles } from "./student-profiles";
import { programs } from "./programs";
import { subscriptions } from "./subscriptions";
import { sessions, sessionParticipants } from "./sessions";
import { groups, groupMembers } from "./groups";
import { skills, skillProgress } from "./skills";
import { sessionNotes, sessionResources } from "./session-notes";
import { resources } from "./resources";
import { payments } from "./payments";

// ─── Relations ───────────────────────────────────────────
//
// Diagramme simplifié :
//
//   users 1──1 studentProfiles
//                  │
//                  ├──N subscriptions ──1 programs
//                  │       │
//                  │       ├──N sessions
//                  │       │     ├──1 sessionNotes
//                  │       │     ├──N sessionResources
//                  │       │     └──N sessionParticipants ── studentProfiles
//                  │       │
//                  │       └──N payments
//                  │
//                  ├──N payments (cross-forfait history)
//                  │
//                  ├──N groupMembers ──1 groups ──1 programs
//                  │                         │
//                  │                         └──N sessions (séances de groupe)
//                  │
//                  └──N skillProgress ──1 skills ──1 programs (référentiel)

export const usersRelations = relations(users, ({ one }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
}));

export const studentProfilesRelations = relations(
  studentProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [studentProfiles.userId],
      references: [users.id],
    }),
    subscriptions: many(subscriptions),
    payments: many(payments),
    sessionParticipations: many(sessionParticipants),
    groupMemberships: many(groupMembers),
    skillProgress: many(skillProgress),
  })
);

export const programsRelations = relations(programs, ({ many }) => ({
  subscriptions: many(subscriptions),
  resources: many(resources),
  groups: many(groups),
  skills: many(skills),
}));

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    studentProfile: one(studentProfiles, {
      fields: [subscriptions.studentProfileId],
      references: [studentProfiles.id],
    }),
    program: one(programs, {
      fields: [subscriptions.programId],
      references: [programs.id],
    }),
    sessions: many(sessions),
    payments: many(payments),
  })
);

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [sessions.subscriptionId],
    references: [subscriptions.id],
  }),
  group: one(groups, {
    fields: [sessions.groupId],
    references: [groups.id],
  }),
  notes: one(sessionNotes, {
    fields: [sessions.id],
    references: [sessionNotes.sessionId],
  }),
  participants: many(sessionParticipants),
  resources: many(sessionResources),
}));

export const sessionParticipantsRelations = relations(
  sessionParticipants,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionParticipants.sessionId],
      references: [sessions.id],
    }),
    studentProfile: one(studentProfiles, {
      fields: [sessionParticipants.studentProfileId],
      references: [studentProfiles.id],
    }),
  })
);

export const sessionNotesRelations = relations(sessionNotes, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionNotes.sessionId],
    references: [sessions.id],
  }),
}));

export const sessionResourcesRelations = relations(
  sessionResources,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionResources.sessionId],
      references: [sessions.id],
    }),
  })
);

export const resourcesRelations = relations(resources, ({ one }) => ({
  program: one(programs, {
    fields: [resources.programId],
    references: [programs.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  program: one(programs, {
    fields: [groups.programId],
    references: [programs.id],
  }),
  members: many(groupMembers),
  sessions: many(sessions),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  studentProfile: one(studentProfiles, {
    fields: [groupMembers.studentProfileId],
    references: [studentProfiles.id],
  }),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  program: one(programs, {
    fields: [skills.programId],
    references: [programs.id],
  }),
  progress: many(skillProgress),
}));

export const skillProgressRelations = relations(skillProgress, ({ one }) => ({
  skill: one(skills, {
    fields: [skillProgress.skillId],
    references: [skills.id],
  }),
  studentProfile: one(studentProfiles, {
    fields: [skillProgress.studentProfileId],
    references: [studentProfiles.id],
  }),
  session: one(sessions, {
    fields: [skillProgress.sessionId],
    references: [sessions.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  studentProfile: one(studentProfiles, {
    fields: [payments.studentProfileId],
    references: [studentProfiles.id],
  }),
}));
