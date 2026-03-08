import Button, { BUTTON_VARIANT } from "../../engine/ui/button/button";
import "./home.scss";

const Home = () => {
  return (
    <div className="homeScreen">
      <div className="homeScreen__overlay">
        <main className="homeScreen__content">
          <p className="homeScreen__eyebrow">Football Career Mode</p>
          <h1 className="homeScreen__title">Build Your Club Legacy</h1>
          <p className="homeScreen__summary">
            Start from day one and shape your team identity before the season begins.
          </p>
          <Button variant={BUTTON_VARIANT.PRIMARY} to="/career/start">
            Start Career
          </Button>
        </main>
      </div>

      <div className="homeScreen__support">
        <h2 className="homeScreen__supportTitle">Season Roadmap</h2>
        <p className="homeScreen__supportText">
          Team setup, staff planning, scouting, training, and matchday routes are ready to expand.
        </p>
      </div>
    </div>
  );
};

export default Home;
