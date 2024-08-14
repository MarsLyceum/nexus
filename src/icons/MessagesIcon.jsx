import * as React from "react";
import Svg, { G, Path, Line, Defs, ClipPath, Rect } from "react-native-svg";
const MessagesIcon = (props) => (
  <Svg
    width={29}
    height={28}
    viewBox="0 0 29 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <G clipPath="url(#clip0_785_6837)">
      <Path
        d="M27.2594 13.5174C27.2594 19.2942 21.8496 23.9772 15.1761 23.9772C11.5671 23.9772 3.09277 23.9772 3.09277 23.9772C3.09277 23.9772 3.09277 16.1701 3.09277 13.5174C3.09277 7.74061 8.50266 3.05762 15.1761 3.05762C21.8496 3.05762 27.2594 7.74061 27.2594 13.5174Z"
        fill="white"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.13477 10.3799H20.0098"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.13477 14.5635H20.0098"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.13477 18.7471H15.1764"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1={8.48389}
        y1={16.8789}
        x2={19.7068}
        y2={16.8789}
        stroke="#C4C4C4"
      />
      <Line
        x1={9.59912}
        y1={13.0176}
        x2={20.822}
        y2={13.0176}
        stroke="#C4C4C4"
      />
      <Line
        x1={11.8301}
        y1={9.15527}
        x2={23.053}
        y2={9.15527}
        stroke="#C4C4C4"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_785_6837">
        <Rect width={29} height={28} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default MessagesIcon;