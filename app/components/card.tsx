import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import {
  CardBody,
  CardHeader,
  Divider,
  Card as NextCard,
} from "@nextui-org/react";
import { useState } from "react";
import { useUser } from "@clerk/remix";
import { useAtom } from "jotai";
import { notes } from "~/atoms";

interface Props {
  title?: string;
  body: string;
  mdBody: string;
  startXPos: number;
  startYPos: number;
  id: string;
  createdAt: Date;
  isDefault: boolean;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

const Card = (props: Props) => {
  const [localNotes, setLocalNotes] = useAtom(notes);
  const user = useUser();
  const [{ x, y }, sApi] = useSpring(() => ({
    x: props.startXPos,
    y: props.startYPos,
  }));
  const [startX, setStartX] = useState(props.startXPos);
  const [startY, setStartY] = useState(props.startYPos);
  const [dragging, setDragging] = useState(false);

  // use sound fx here
  const bind = useDrag(({ event, down, movement: [mx, my] }) => {
    const ignoreButton = (event.target as Element).closest(".connector");

    if (ignoreButton) return;

    if (down) {
      setDragging(true);
      const newX = Math.max(0, mx + startX);
      const newY = Math.max(0, my + startY);
      sApi.start({ x: newX, y: newY, immediate: down });
    } else {
      // play place fx here
      setDragging(false);
      setStartX(x.get());
      setStartY(y.get());
      const noteid = props.id;
      let noteIndex = localNotes.findIndex((note) => note.id === noteid);
      localNotes[noteIndex].positionX = x.get();
      localNotes[noteIndex].positionY = y.get();

      setLocalNotes(localNotes);
      // get note here???
    }
  });

  return (
    <animated.div
      id={props.id}
      onClick={props.onClick}
      className={`card ${dragging ? "shadow-xl" : "shadow-none"} absolute min-w-[200px] max-w-[400px] rounded-2xl border border-solid border-slate-300`}
      {...bind()}
      style={{
        x,
        y,
        touchAction: "none",
        cursor: "pointer",
        userSelect: "none",
        overflow: "visible",
      }}
    >
      <NextCard style={{ width: "auto " }} shadow="none">
        <CardHeader className="flex items-center justify-between">
          <span className="text-lg font-bold">
            {props.title
              ? props.title
              : new Date(props.createdAt).toLocaleString("th-TH")}
          </span>
          <button className="connector ml-4 h-4 w-4 cursor-cell rounded-full border-2 border-solid bg-transparent"></button>
        </CardHeader>
        <Divider />
        <CardBody className="h-full py-4">
          <div dangerouslySetInnerHTML={{ __html: props.body }}></div>
        </CardBody>
      </NextCard>
    </animated.div>
  );
};

export default Card;
