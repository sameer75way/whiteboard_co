import { Group, Path, Text, Rect } from "react-konva";
import { useSelector } from "react-redux";
import type { Cursor } from "../../../../store/collaboration/collabSlice";
import type { RootState } from "../../../../store/index";

interface Props {
  currentScale: number;
}

export const CollaboratorCursors = ({ currentScale }: Props) => {
  const cursors = useSelector(
    (state: RootState) => state.collaboration.cursors
  );

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const cursorList = Object.values(cursors).filter(
    (c: Cursor) => c.userId !== currentUser?.id
  ) as Cursor[];

  const inverseScale = 1 / currentScale;

  return (
    <Group listening={false} id="collaborator-cursors">
      {cursorList.map((cursor) => (
        <Group
          key={cursor.userId}
          x={cursor.x}
          y={cursor.y}
          scaleX={inverseScale}
          scaleY={inverseScale}
          listening={false}
        >
          <Path
            data="M0,0 L0,18 L4.5,13.5 L9.5,23.5 L12.5,22 L7.5,12 L13.5,12 Z"
            fill="#10b981"
            stroke="white"
            strokeWidth={1.5}
            scaleX={1.2}
            scaleY={1.2}
            shadowColor="rgba(0,0,0,0.5)"
            shadowBlur={4}
            shadowOffsetY={2}
          />
          
          <Group x={15} y={15}>
            <Rect
              width={(cursor.name || 'User').length * 7 + 16}
              height={22}
              fill="#10b981"
              cornerRadius={6}
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={4}
              shadowOffsetY={1}
            />
            <Text
              text={cursor.name || 'User'}
              fill="white"
              fontSize={11}
              fontStyle="bold"
              padding={6}
            />
          </Group>
        </Group>
      ))}
    </Group>
  );
};