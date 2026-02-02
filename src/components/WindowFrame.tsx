import React from "react";

type WindowFrameProps = {
  title?: string;
  children: React.ReactNode;
};

const WindowFrame = ({ title = "Lumen", children }: WindowFrameProps) => {
  return (
    <div className="window-frame">
      <div className="window-titlebar">
        <div className="traffic-lights">
          <span className="traffic-light close" />
          <span className="traffic-light minimize" />
          <span className="traffic-light expand" />
        </div>
        <div className="window-title">{title}</div>
      </div>
      {children}
    </div>
  );
};

export default WindowFrame;
