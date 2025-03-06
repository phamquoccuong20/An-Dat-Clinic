"use strict";

/* Package System */
import React from "react";
import Router, { withRouter } from "next/router";
import { connect } from "react-redux";
require("dotenv").config();
/* Package Application */
import Moment from "moment";
import {
  handleFailure,
  handleSuccess,
  setFormLayout,
  setDetailLayout,
  setImportLayout,
} from "@features/Status";
import { updateProfile } from "@features/Account";
import { IconButton } from "@mui/material";
import _, { isArray, random } from "lodash";
import Image from "next/image";
import FileSaver from "file-saver";

class ImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.tagRef = React.createRef();
    this.state = {
      values: {},
      errors: [],
      preview: this.props.preview,
      helperText: this.props.helperText,
    };
  }

  handleUpload = (e) => {
    let _err = this.state.errors;
    let _findKey = _.findIndex(_err, { key: e.currentTarget?.name });
    delete _err[_findKey];
    if (
      e.currentTarget.files[0].size / 1000 >= 2000 &&
      e.currentTarget.files[0].type.indexOf("image") >= 0
    ) {
      _err.push({
        key: e.currentTarget?.name,
        msg: "Hình ảnh phải nhỏ hơn < 2Mb",
      });
      this.setState({ errors: _err });
      return;
    } else if (
      e.currentTarget.files[0].size / 1000 >= 10000 &&
      e.currentTarget.files[0].type.indexOf("video") >= 0
    ) {
      _err.push({
        key: e.currentTarget?.name,
        msg: "Video phải nhỏ hơn < 10Mb",
      });
      this.setState({ errors: _err });
      return;
    }
    if (e.currentTarget?.name) {
      const _oldFile =
        this.state.oldFile && this.state.id
          ? this.state.oldFile
          : this.props.preview[e.currentTarget.name];
      this._isMounted &&
        this.setState({
          oldFile: _oldFile,
          preview: {
            ...this.props.preview,
            [e.currentTarget.name]: URL.createObjectURL(
              e.currentTarget.files[0]
            ),
          },
        });
      let _reader = new FileReader();
      let _name = e.currentTarget.name;
      let image = URL.createObjectURL(e.currentTarget.files[0]);
      _reader.onload = (e) => {
        let img = [];

        if (_name == "invitation_template") {
          this.handelDeleteObject("template");
          this.handleSource("template", 500, e.target.result, false);
        }
      };
      _reader.readAsDataURL(e.currentTarget.files[0]);
    }
  };
  render() {
    const { key, label, required } = this.props.field;
    const { helperText } = this.state;
    return (
      <>
        <div
          className={
            "avatarUpload mt-2 " + (this.props._findKey >= 0 ? "error" : "")
          }
        >
          <div
            className={
              "img " + (this.props.preview[this.props.field.key] ? "" : "show")
            }
          >
            <Image
              src={
                this.props.preview[this.props.field.key]
                  ? this.props.preview[this.props.field.key]
                  : "/images/transparent.png"
              }
              alt="Picture of the author"
              className="img-cover"
              layout="fill"
            />

            {!this.props._readOnly && (
              <label
                htmlFor={this.props.field.key}
                className="btnInputFile"
                onChange={this.handleUpload}
              >
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                >
                  <i className="fal fa-edit"></i>
                </IconButton>
              </label>
            )}
            {this.props.preview[this.props.field.key] && (
              <label
                htmlFor={this.props.field.key}
                className="btnInputFile btndowload"
                onClick={(e) => {
                  e.preventDefault();
                  FileSaver.saveAs(
                    this.props.preview[this.props.field.key],
                    "dowload"
                  );
                }}
              >
                <IconButton
                  color="primary"
                  aria-label="dowload picture"
                  component="span"
                >
                  <i className="fal fa-download"></i>
                </IconButton>
              </label>
            )}
          </div>
          <input
            accept="image/*"
            className="inputFile"
            name={this.props.field.key}
            id={this.props.field.key}
            type="file"
            onChange={this.handleUpload}
          />
          <p className="MuiFormHelperText-root">
            {this.props._findKey >= 0 ? _errArr[this.props._findKey].msg : ""}
          </p>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    stateStatus: state.status,
    stateAccount: state.account,
    stateKolDesc: state.kolDesc,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    handleSuccess: (msg) => {
      dispatch(handleSuccess(msg));
    },
    setFormLayout: (val) => {
      dispatch(setFormLayout(val));
    },
    handleFailure: (msg) => {
      dispatch(handleFailure(msg));
    },
    updateProfile: (val) => {
      dispatch(updateProfile(val));
    },
    setDetailLayout: (val) => {
      dispatch(setDetailLayout(val));
    },
    setImportLayout: (val) => {
      dispatch(setImportLayout(val));
    },
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ImageUpload)
);
