/* eslint-disable react/prop-types */
import "./pageLayout.scss";

const PageLayout = ({ title, subtitle, children }) => {
  return (
    <div className="gamePage">
      <div className="gamePage__inner">
        <main className="gamePage__main">{children}</main>
      </div>
    </div>
  );
};

export default PageLayout;
