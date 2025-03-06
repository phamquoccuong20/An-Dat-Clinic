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
  setFormLayout,
} from "@features/Status";

import "swiper/css";
import "swiper/css/pagination";

class Tab extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this._timeLoad = null;
    this.state = {
      isLoadedData: false,
      module: props.router.query.pages[0] ?? "",
      id: props.router.query.pages[1] ?? "",
      data: {},
      total: {},
      errors: [],
      isDelete: false,
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
    return (
      <>
        <div className="tabPlatForm__head tabPlatForm__head--text">
          <ul>
            {this.props.tabPlatformData.map((value, key) =>
                <li
                  key={key}
                  data-platform={value.key}
                  className={
                    this.props.tabPlatForm === value.key ? "active" : ""
                  }
                  onClick={this.props.onClick}
                >
                  {value.name}  
                </li>
            )}
          </ul>
        </div>
      </>
    );
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Tab));
