import React from "react";
import { connect } from "react-redux";

import TestError from "./TestError";
import {
  finishBlock,
  finishTest,
  setCompatibleMilliseconds,
  setIncompatibleMilliseconds,
  storeTestResult,
} from "../actions";
import IMPLICIT_BIAS_TEST_BLOCKS from "../constants/ImplicitBiasTestBlocks";
import INPUT_KEYS, { getEventKeyForInputKey } from "../constants/InputKeys";
import targetAndCategoryValues from "../data/targetAndCategoryValues";
import { toTitleCase } from "../formatters";
import TARGET_CATEGORY_DISPLAY_TYPE from "../constants/TargetCategoryDisplayType";

const TARGET_OR_CATEGORY = {
  TARGET: "target",
  CATEGORY: "category",
};

const LEFT_OR_RIGHT = {
  LEFT: "LEFT",
  RIGHT: "RIGHT",
};

const TARGET_CATEGORY_ORDER = [
  TARGET_OR_CATEGORY.TARGET,
  TARGET_OR_CATEGORY.CATEGORY,
];
const LEFT_RIGHT_OPTIONS = [LEFT_OR_RIGHT.LEFT, LEFT_OR_RIGHT.RIGHT];

class ActiveTest extends React.Component {
  constructor() {
    super();
    this.state = {
      currentRound: -1,
      roundStartTime: null,
      userAnswerValue: null, // Store the user's first response
      firstResponseTime: null, // Store the time taken for first response
      testResults: [],
    };
  }

  componentDidMount() {
    if (!!this.props.currentBlock && this.props.currentBlock.critical) {
      this.setState({ timeStarted: Date.now() });
    }
    document.addEventListener("keyup", this.handleKeyPress);
    this.startNewRound();
    console.log(
      "Test results from Redux store on mount:",
      this.props.currentTest.results
    );
  }

  componentWillUnmount() {
    document.removeEventListener("keyup", this.handleKeyPress);

    if (this.props.currentBlock.critical) {
      const totalTime = Date.now() - this.state.timeStarted;
      this.props.currentBlock.displayType ===
      TARGET_CATEGORY_DISPLAY_TYPE.COMPATIBLE_ALL
        ? this.props.dispatchSetCompatibleMilliseconds(totalTime)
        : this.props.dispatchSetIncompatibleMilliseconds(totalTime);
    }

    if (
      this.props.currentTest.currentBlockIndex ===
      IMPLICIT_BIAS_TEST_BLOCKS.length - 1
    ) {
      this.props.dispatchFinishTest();
    }

    // Dynamically create the object key (e.g., part1, part2, part3)
    const partKey = `part${this.props.currentTest.currentBlockIndex + 1}`;
    const finalResults = { [partKey]: this.state.testResults };
    this.props.dispatchStoreTestResult([finalResults]);

    console.log("Final structured results dispatched:", finalResults);
  }

  valuesForOptions = (targetOrCategory, leftOrRight) => {
    if (targetOrCategory === TARGET_OR_CATEGORY.TARGET) {
      return leftOrRight === LEFT_OR_RIGHT.LEFT
        ? this.props.leftTargetValues
        : this.props.rightTargetValues;
    }
    return leftOrRight === LEFT_OR_RIGHT.LEFT
      ? this.props.leftCategoryValues
      : this.props.rightCategoryValues;
  };

  startNewRound = () => {
    if (this.state.currentRound !== -1) {
      let roundTime = Date.now() - this.state.roundStartTime;

      const correctAnswerValue =
        this.state.targetOrCategory === "target"
          ? this.state.leftOrRight === "LEFT"
            ? this.props?.leftTarget
            : this.props?.rightTarget
          : this.state.leftOrRight === "LEFT"
          ? this.props?.leftCategory
          : this.props?.rightCategory;

      if (this.state.userAnswerValue === correctAnswerValue) {
        roundTime = this.state.firstResponseTime;
      }

      // Structure the test result
      const testResult = {
        roundNumber: this.state.currentRound,
        question: this.state.valueToDisplay,
        correctAnswer: correctAnswerValue,
        userAnswer: this.state.userAnswerValue,
        responseTime: this.state.firstResponseTime,
        totalRoundTime: roundTime,
        correctKey:
          this.state.leftOrRight === LEFT_OR_RIGHT.LEFT ? "LEFT" : "RIGHT",
        targetOrCategory: this.state.targetOrCategory,
      };

      // Push result to local state
      this.setState((prevState) => ({
        testResults: [...prevState.testResults, testResult],
      }));
    }

    // Continue with new round setup
    const currentRound = this.state.currentRound + 1;
    if (currentRound >= this.props.currentBlock.numTrials) {
      return this.props.dispatchFinishBlock();
    }

    const targetOrCategory = !!this.props.soleTargetOrCategory
      ? this.props.soleTargetOrCategory
      : TARGET_CATEGORY_ORDER[currentRound % 2];

    const leftOrRight = LEFT_RIGHT_OPTIONS[Math.round(Math.random())];
    const values = this.valuesForOptions(targetOrCategory, leftOrRight);

    const valuesWithoutLastTwoRoundValues = values.filter(
      (v) =>
        [this.state.valueToDisplay, this.state.lastValueToDisplay].indexOf(
          v
        ) === -1
    );

    const valueToDisplayIndex = Math.floor(
      Math.random() * valuesWithoutLastTwoRoundValues.length
    );
    const valueToDisplay = valuesWithoutLastTwoRoundValues[valueToDisplayIndex];

    const roundStartTime = Date.now();

    this.setState({
      currentRound,
      targetOrCategory,
      leftOrRight,
      valueToDisplay,
      lastValueToDisplay: this.state.valueToDisplay,
      incorrectKeyPressed: false,
      roundStartTime,
      userAnswerValue: null,
      firstResponseTime: null,
    });

    console.log("test results:", this.state.testResults);
  };

  handleKeyPress = (event) => {
    if (!this.state.userAnswerValue) {
      const responseTime = Date.now() - this.state.roundStartTime;
      this.setState({ firstResponseTime: responseTime });
    }

    switch (event.key) {
      case getEventKeyForInputKey(INPUT_KEYS.LEFT):
        return this.handleLeftKeyPress();
      case getEventKeyForInputKey(INPUT_KEYS.RIGHT):
        return this.handleRightKeyPress();
      default:
        return;
    }
  };

  handleLeftKeyPress = () => {
    if (!this.state.userAnswerValue) {
      this.setState({
        userAnswerValue: this.props.leftCategory || this.props.leftTarget,
      });
    }

    if (this.state.leftOrRight === LEFT_OR_RIGHT.LEFT) {
      return this.startNewRound();
    } else if (this.state.leftOrRight === LEFT_OR_RIGHT.RIGHT) {
      this.displayIncorrectKeySign();
    }
  };

  handleRightKeyPress = () => {
    if (!this.state.userAnswerValue) {
      this.setState({
        userAnswerValue: this.props.rightCategory || this.props.rightTarget,
      });
    }

    if (this.state.leftOrRight === LEFT_OR_RIGHT.RIGHT) {
      return this.startNewRound();
    } else if (this.state.leftOrRight === LEFT_OR_RIGHT.LEFT) {
      this.displayIncorrectKeySign();
    }
  };

  displayIncorrectKeySign = () => {
    this.setState({ incorrectKeyPressed: true });
  };

  render() {
    const { currentBlock } = this.props;
    const { valueToDisplay, targetOrCategory, incorrectKeyPressed } =
      this.state;

    if (!currentBlock) return <TestError />;

    return (
      <div>
        <div className={`displayed-test-value ${targetOrCategory}`}>
          {toTitleCase(valueToDisplay)}
        </div>
        <div className="incorrect-key-x">{incorrectKeyPressed && "X"}</div>
        <p>
          If you make a mistake, a red <span className="bold-red">X</span> will
          appear. Press the other key to continue.
        </p>
      </div>
    );
  }
}

const getSoleTargetOrCategory = (leftTarget, leftCategory) => {
  if (!!leftTarget && !leftCategory) return TARGET_OR_CATEGORY.TARGET;
  if (!leftTarget && !!leftCategory) return TARGET_OR_CATEGORY.CATEGORY;
  return null;
};

const mapStateToProps = (
  { currentTest },
  { leftTarget, leftCategory, rightTarget, rightCategory }
) => {
  return {
    currentTest,
    currentBlock: IMPLICIT_BIAS_TEST_BLOCKS[currentTest.currentBlockIndex],
    leftTargetValues: !!leftTarget ? targetAndCategoryValues[leftTarget] : null,
    rightTargetValues: !!rightTarget
      ? targetAndCategoryValues[rightTarget]
      : null,
    leftCategoryValues: !!leftCategory
      ? targetAndCategoryValues[leftCategory]
      : null,
    rightCategoryValues: !!rightCategory
      ? targetAndCategoryValues[rightCategory]
      : null,
    soleTargetOrCategory: getSoleTargetOrCategory(leftTarget, leftCategory),
  };
};

const mapDispatchToProps = (dispatch) => ({
  dispatchFinishBlock: () => dispatch(finishBlock()),
  dispatchFinishTest: () => dispatch(finishTest()),
  dispatchSetCompatibleMilliseconds: (millis) =>
    dispatch(setCompatibleMilliseconds(millis)),
  dispatchSetIncompatibleMilliseconds: (millis) =>
    dispatch(setIncompatibleMilliseconds(millis)),
  dispatchStoreTestResult: (testResults) =>
    dispatch(storeTestResult(testResults)), // New action
});

const VisibleActiveTest = connect(
  mapStateToProps,
  mapDispatchToProps
)(ActiveTest);

export default VisibleActiveTest;
