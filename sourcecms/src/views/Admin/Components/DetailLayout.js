"use strict";

/* Package System */
import React from "react";
import Link from "next/link";
import Router, { withRouter } from "next/router";
import { connect } from "react-redux";
import _ from "lodash";
const moment = require("moment");

/* Package Application */
import {
  handleFailure,
  handleSuccess,
  setDetailLayout,
  setFormLayout,
} from "@features/Status";
import { fetchApi, formatNum } from "@utils/Helper";
import ReactApexChart from "react-apexcharts";

class DetailLayout extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this._timeLoad = null;
    this.state = {
      isLoadedData: false,
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
  }

  async componentDidUpdate(prevProps, prevState) {}

  render() {
    return <>XIN CHÀO</>;
  }
}

const mapStateToProps = (state) => {
  return {
    stateStatus: state.status,
    stateAccount: state.account,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setDetailLayout: (val) => {
      dispatch(setDetailLayout(val));
    },
    handleSuccess: (msg) => {
      dispatch(handleSuccess(msg));
    },
    handleFailure: (msg) => {
      dispatch(handleFailure(msg));
    },
    setFormLayout: (val) => {
      dispatch(setFormLayout(val));
    },
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(DetailLayout)
);
