import { atomWithStorage } from "jotai/utils";
import { notes as Notes } from "./.server/schema";
import { atom } from "jotai";

export const notes = atomWithStorage(
  "notes",
  [] as (typeof Notes.$inferInsert)[],
);

export const showEditModalAtom = atom(false);
export const modalPositionXAtom = atom(0);
export const modalPositionYAtom = atom(0);
export const editNoteContentAtom = atom("");

export const noteToEditAtom = atom(null as null | typeof Notes.$inferInsert);
