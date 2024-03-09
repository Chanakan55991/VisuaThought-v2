import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useAtom } from "jotai";
import remarkParse from "node_modules/remark-parse/lib";
import { useEffect, useRef, useState } from "react";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remark2rehype from "remark-rehype";
import { unified } from "unified";
import {
  editNoteContentAtom,
  modalPositionXAtom,
  modalPositionYAtom,
  noteToEditAtom,
  notes as notesAtom,
  showEditModalAtom,
} from "~/atoms";
import { db } from "~/.server/db";
import Card from "~/components/card";
import {
  CardBody,
  CardFooter,
  Divider,
  Card as NextCard,
  Textarea,
} from "@nextui-org/react";
import { notes as notesTable } from "~/.server/schema";
import { eq, or } from "drizzle-orm";
import { getAuth } from "@clerk/remix/ssr.server";
import { json, useLoaderData, useSubmit } from "@remix-run/react";
import { animated, useSpring } from "@react-spring/web";
import cuid2, { createId } from "@paralleldrive/cuid2";

export const meta: MetaFunction = () => {
  return [
    { title: "VisuaThougth" },
    { name: "description", content: "Node-based note taking web app" },
  ];
};

const remarkProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remark2rehype)
  .use(rehypeStringify);

export const loader: LoaderFunction = async (args) => {
  const { userId } = await getAuth(args);
  const notes = await db
    .select()
    .from(notesTable)
    .where(
      or(
        eq(notesTable.authorId, userId ? userId : "1"), // take notes from default user by default
        eq(notesTable.isDefault, 1),
      ),
    );
  const parsedNotes = notes.map((note) => {
    return {
      ...note,
    };
  });
  return json(notes);
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("intent");
  switch (action) {
    case "addNote": {
      const note = JSON.parse(
        String(formData.get("note")!), // we are sure it's there because we submit them directly
      ) as typeof notesTable.$inferInsert;
      console.log(note);
      const res = await db.insert(notesTable).values(note);
      console.log(res);
    }
  }
  return json({});
};

/* CLIENT */

export default function Index() {
  const [localNotes, setLocalNotes] = useAtom(notesAtom);
  const [showEditModal, setShowEditModal] = useAtom(showEditModalAtom);
  const [editNoteContent, setEditNoteContent] = useAtom(editNoteContentAtom);
  const [noteToEdit, setNoteToEdit] = useAtom(noteToEditAtom);

  const [modalPositionX, setModalPositionX] = useAtom(modalPositionXAtom);
  const [modalPositionY, setModalPositionY] = useAtom(modalPositionYAtom);

  const [sessionNotes, setSessionNotes] = useState(
    [] as (typeof notesTable.$inferInsert)[],
  );

  const remoteNotes = useLoaderData<typeof loader>(); // this is the notes returned from db, as remoteNotes
  const mainRef = useRef<HTMLDivElement>(null);

  const submit = useSubmit();

  const onClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLDivElement;
    if (target !== e.currentTarget) return;
    setModalPositionX(e.clientX + scrollX);
    setModalPositionY(e.clientY + scrollY);

    if (target.id === "main") {
      setShowEditModal(!showEditModal);
      if (!showEditModal) {
        setNoteToEdit(null);
        setEditNoteContent("");
      }
      return;
    }

    const noteId = target.id;
    const toEdit = localNotes.find((note) => note.id === noteId);

    if (toEdit) {
      setNoteToEdit(toEdit);
      setEditNoteContent(toEdit.content!);
      setShowEditModal(true);
    }
    // below here are for editing
  };

  const onKeyPress: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setShowEditModal(false);
      // if new note then do this
      if (!noteToEdit) {
        const newNote = {
          content: editNoteContent,
          id: createId(),
          isDefault: 1, // for me to create stuff for all users rn
          authorId: "1", // modify this to user id instead later on
          positionX: modalPositionX,
          positionY: modalPositionY,
        } satisfies typeof notesTable.$inferInsert;
        setLocalNotes([...localNotes, newNote]);
        console.log(localNotes);
        // call server action to update remote note with local, inserting new note

        const formData = new FormData();
        formData.append("intent", "addNote");
        formData.append("note", JSON.stringify(newNote));
        submit(formData, { method: "post", navigate: false });
        return;
      }
    }
  };

  const noteSpring = useSpring({
    from: { opacity: 0, scale: 0.9 },
    to: {
      opacity: showEditModal ? 1 : 0,
      scale: showEditModal ? 1 : 0.9,
      left: modalPositionX,
      top: modalPositionY,
    },
    config: { tension: 200, friction: 20 },
  });

  useEffect(() => {
    const withDupes = [...remoteNotes, ...localNotes];
    // find duplication (via id property within sessionNotes)

    let resolvedNotes = [] as (typeof notesTable.$inferInsert)[];
    const uniqueIds = new Set();

    withDupes.forEach((note) => {
      if (!uniqueIds.has(note.id!)) {
        uniqueIds.add(note.id!);
        resolvedNotes.push(note);
        return; // Early return if unique
      }

      // Conflict: Find the latest version
      const existingNotes = sessionNotes.filter((n) => n.id === note.id!);
      const latest = existingNotes.reduce((prev, current) =>
        parseInt(prev.updatedAt!) > parseInt(current.updatedAt!)
          ? prev
          : current,
      );

      //delete existing one first
      resolvedNotes = resolvedNotes.filter((n) => n.id !== note.id);
      // then push the one with latest data
      resolvedNotes.push(latest);
    });

    // store this resolved state in both client and server

    setSessionNotes(resolvedNotes);
    console.log(resolvedNotes);
  }, [localNotes]);

  return (
    <main
      ref={mainRef}
      id="main"
      className="bg flex h-full min-h-screen flex-col overflow-scroll"
      onClick={onClick}
    >
      {sessionNotes.map((note) => (
        <Card
          key={note.id}
          title={note.content!.split("\n")[0]}
          body={String(
            remarkProcessor.processSync(
              note.content!.split("\n").slice(1).join("\n"),
            ),
          )}
          mdBody={note.content!.split("\n").slice(1).join("\n")}
          startXPos={note.positionX ? note.positionX : 50}
          startYPos={note.positionY ? note.positionY : 50}
          id={note.id!}
          createdAt={new Date()}
          isDefault={true}
          onClick={onClick}
        />
      ))}

      {showEditModal && (
        <animated.div
          style={noteSpring}
          className="absolute rounded-2xl border border-solid border-[#0006]"
        >
          <NextCard>
            <CardBody>
              <Textarea
                value={editNoteContent}
                onValueChange={(value) => setEditNoteContent(value)}
                onKeyDown={onKeyPress}
                className="h-full"
                maxRows={3}
                placeholder="Jot down your mind!"
              />
            </CardBody>
            <Divider />
            <CardFooter>
              <div className="relative inline-block rounded-md border border-[#0006] px-[9px] py-[5px]">
                <label>
                  <input type="checkbox" />
                </label>
              </div>
            </CardFooter>
          </NextCard>
        </animated.div>
      )}
    </main>
  );
}
