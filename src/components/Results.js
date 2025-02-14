import React, { Component } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

import { resetTest } from "../actions";
import BIAS from "../constants/Bias";
import { toTitleCase } from "../formatters";

const BIAS_THRESHOLD = 1000;

const BACKEND_API_URL =
  "https://demographic-survey-backend.vercel.app/api/save-survey";

const getBias = (incompatibleMilliseconds, compatibleMilliseconds) => {
  const incompatibleCompatibleDiff =
    incompatibleMilliseconds - compatibleMilliseconds;
  if (Math.abs(incompatibleCompatibleDiff) <= BIAS_THRESHOLD) {
    return BIAS.NONE;
  }
  return incompatibleCompatibleDiff > 0 ? BIAS.COMPATIBLE : BIAS.INCOMPATIBLE;
};

const getResultStatement = (bias, test) => {
  const { targetType, categoryType, compatible } = test;
  const targetsInCompatibleOrder = Object.keys(compatible);
  const categories = Object.values(compatible);
  const firstCategory = categories[0];
  const secondCategory = categories[1];
  switch (bias) {
    case BIAS.NONE:
      return (
        <p className="result-headline">
          Your responses suggest no automatic association between{" "}
          <span className="target">{targetType}</span> and{" "}
          <span className="category">{categoryType}</span>.
        </p>
      );
    case BIAS.COMPATIBLE:
      return (
        <h4 className="result-headline">
          Your responses suggest an automatic association for{" "}
          <span className="target">
            {toTitleCase(targetsInCompatibleOrder[0])}
          </span>{" "}
          with <span className="category">{toTitleCase(firstCategory)}</span>{" "}
          and{" "}
          <span className="target">
            {toTitleCase(targetsInCompatibleOrder[1])}
          </span>{" "}
          with <span className="category">{toTitleCase(secondCategory)}</span>.
        </h4>
      );
    case BIAS.INCOMPATIBLE:
      const targetsInIncompatibleOrder = targetsInCompatibleOrder
        .slice()
        .reverse();
      return (
        <h4 className="result-headline">
          Your responses suggest an automatic association for{" "}
          <span className="target">
            {toTitleCase(targetsInIncompatibleOrder[0])}
          </span>{" "}
          with <span className="category">{toTitleCase(firstCategory)}</span>{" "}
          and{" "}
          <span className="target">
            {toTitleCase(targetsInIncompatibleOrder[1])}
          </span>{" "}
          with <span className="category">{toTitleCase(secondCategory)}</span>.
        </h4>
      );
    default:
      return "We were unable to calculate your results due to an unexpected error.";
  }
};

class Results extends Component {
  componentDidMount() {
    this.uploadResultsToMongoDB();
  }
  componentWillUnmount() {
    this.props.dispatchResetTest();
  }

  uploadResultsToMongoDB = async () => {
    const { test, results, demographicForm } = this.props;

    if (!test || !results || results.length === 0) {
      console.error("No test data to upload.");
      return;
    }

    // Prepare data for MongoDB
    const dataToUpload = {
      testId: test.id,
      testName: test.name,
      testType: test.targetType,
      timestamp: new Date().toISOString(),
      results: results,
      demographicInfo: demographicForm,
    };

    try {
      const response = await fetch(BACKEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToUpload),
      });

      const result = await response.json();
      console.log("✅ Data saved:", result);

      if (response.ok) {
        alert("Test results uploaded successfully!");
      } else {
        throw new Error(result.error || "Failed to upload data.");
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert("Failed to upload test results.");
    }
  };

  render() {
    const { test, currentTest, results } = this.props;
    const { incompatibleMilliseconds, compatibleMilliseconds } = currentTest;
    const bias = getBias(incompatibleMilliseconds, compatibleMilliseconds);
    const resultStatement = getResultStatement(bias, test);
    console.log("results on results.js ", results);
    return (
      <div>
        <h2>Results</h2>
        {resultStatement}
        <p>More info about results to come...</p>
        <Link to="/home">Back to home</Link>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  dispatchResetTest: () => dispatch(resetTest()),
});

const VisibleResults = connect(() => ({}), mapDispatchToProps)(Results);

export default VisibleResults;
