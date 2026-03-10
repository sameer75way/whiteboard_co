import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { Cursor } from "../../../../store/collaboration/collabSlice";
import type { RootState } from "../../../../store/index";

export const CollaboratorCursors = () => {

  const cursors = useSelector(
    (state: RootState) => state.collaboration.cursors
  );

  const cursorList = useMemo(() => Object.values(cursors) as Cursor[], [cursors]);

  return (
    <>
      {cursorList.map((cursor) => (
        <div
          key={cursor.userId}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none",
            zIndex: 999,
            transform: `translate(${cursor.x - 2}px, ${cursor.y - 2}px)`,
            transition: "transform 0.05s linear",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <svg
            width="24"
            height="36"
            viewBox="0 0 24 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.5))" }}
          >
            <path
              d="M5.65376 33.1598L0.126435 0.505295C0.0210287 -0.117497 0.697505 -0.320708 1.05388 0.222883L18.4411 26.7828C18.7758 27.2941 18.2573 27.9158 17.6537 27.7262L11.5163 25.808C11.1614 25.697 10.7711 25.7954 10.5106 26.0617L6.82485 29.8291C6.27303 30.3932 5.37829 29.9806 5.56475 29.213L5.65376 33.1598Z"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              background: '#10b981',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              marginTop: '4px',
              marginLeft: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {cursor.name || 'User'}
          </div>
        </div>
      ))}
    </>
  );

};