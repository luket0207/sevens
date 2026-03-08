/* eslint-disable react/prop-types */
import "./pageLayout.scss";

const PageLayout = ({ title, subtitle, children }) => {
  return (
    <div className="gamePage">
      <div className="gamePage__inner">
        <header className="gamePage__header">
          <h1 className="gamePage__title">{title}</h1>
          {subtitle ? <p className="gamePage__subtitle">{subtitle}</p> : null}
        </header>
        <main className="gamePage__main">{children}</main>
      </div>
    </div>
  );
};

export default PageLayout;
