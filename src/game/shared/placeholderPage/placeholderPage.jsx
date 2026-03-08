/* eslint-disable react/prop-types */
import PageLayout from "../pageLayout/pageLayout";
import "./placeholderPage.scss";

const PlaceholderPage = ({ title, description }) => {
  return (
    <PageLayout title={title} subtitle={description}>
      <section className="placeholderPage">
        <h2 className="placeholderPage__title">Feature Placeholder</h2>
        <p className="placeholderPage__text">
          This page route is live and ready for implementation in a later feature.
        </p>
      </section>
    </PageLayout>
  );
};

export default PlaceholderPage;
