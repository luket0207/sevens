import "./goalAnimation.scss";

const GoalAnimation = () => {
  return (
    <div className="goalAnimation" aria-label="Goal scored">
      <span className="goalAnimation__burst" aria-hidden="true" />
      <div className="goalAnimation__textWrap">
        <p className="goalAnimation__eyebrow">Goal Animation</p>
        <h3>GOAL</h3>
      </div>
    </div>
  );
};

export default GoalAnimation;
