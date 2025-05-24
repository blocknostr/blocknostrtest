
import React from "react";

const AlbyLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      width="100%" 
      height="100%"
      fill="currentColor"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="#F5CD00" />
      <text
        x="32"
        y="40"
        fontSize="32"
        fontWeight="bold"
        textAnchor="middle"
        fill="#000000"
      >
        A
      </text>
    </svg>
  );
};

export default AlbyLogo;
