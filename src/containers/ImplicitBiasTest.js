import React from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";

import { startTest } from "../actions";
import Block from "../components/Block";
import Results from "../components/Results";
import TestNotFound from "../components/TestNotFound";
import TestStart from "../components/TestStart";
import tests from "../data/tests";
import "../scss/implicit-bias-test.scss";

const ImplicitBiasTest = ({
  currentTest,
  results,
  demographicForm,
  dispatchStartTest,
}) => {
  const { testId } = useParams();
  const test = tests.find((test) => test.id === testId);
  if (!test) return <TestNotFound />;

  if (!!currentTest) {
    return !currentTest.finished ? (
      <Block test={test} currentTest={currentTest} />
    ) : (
      <Results
        test={test}
        results={results}
        currentTest={currentTest}
        demographicForm={demographicForm} // ✅ Passing demographic info to Results.js
      />
    );
  }

  return (
    <TestStart
      test={test}
      onStartTestButtonPress={() => dispatchStartTest(test)}
    />
  );
};

// ✅ Extract demographic info from Redux and pass it to Results.js
const mapStateToProps = ({ currentTest, demographicForm }) => ({
  currentTest, // Retrieve the test state
  results: currentTest?.results || [], // Retrieve stored results from Redux
  demographicForm, // ✅ Now passing demographic info
});

const mapDispatchToProps = (dispatch) => ({
  dispatchStartTest: (test) => dispatch(startTest(test)),
});

const VisibleImplicitBiasTest = connect(
  mapStateToProps,
  mapDispatchToProps
)(ImplicitBiasTest);

export default VisibleImplicitBiasTest;
