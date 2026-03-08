/* eslint-disable react/prop-types */
import { getShirtStyle } from "../kit/shirtStyles";

const ShirtRenderer = ({ shirt, size = "medium", className = "" }) => {
  const shirtStyle = getShirtStyle(shirt);
  const collarColour = shirt?.detailColour || shirt?.mainColour || "#d5ceb5";

  return (
    <div className={`shirtRenderer shirtRenderer--${size} ${className}`.trim()}>
      <div className="shirtRenderer__shape" style={shirtStyle}>
        <div className="shirtRenderer__collar" style={{ backgroundColor: collarColour }} />
      </div>
    </div>
  );
};

export default ShirtRenderer;
