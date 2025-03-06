"use strict";

/* Package System */
import React from "react";
import Router, { withRouter } from "next/router";
import { connect } from "react-redux";

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
import {
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  FormHelperText,
  Stack,
  Autocomplete,
  NativeSelect,
  Box,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Checkbox,
  Tabs,
  Tab,
  Badge,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import _, { isArray, random } from "lodash";
import Image from "next/image";
import { postApi, fetchApi, putApi, changeToSlug } from "@utils/Helper";
import KolTabs from "./KolTabs";
import ReactPlayer from "react-player";
import FileSaver from "file-saver";
import moment from "moment";
import { fabric } from "fabric";
import CustomEditor from "@components/CustomEditor";
import Spinkit from "@views/Admin/Components/Spinkit";
// import Tab from "@views/Admin/Components/Tab";
import PerfectScrollbar from "react-perfect-scrollbar";
import CancelIcon from "@mui/icons-material/Cancel";

class FormLayout extends React.Component {
  constructor(props) {
    super(props);
    this.tagRef = React.createRef();
    this.state = {
      module: props.router.query?.pages[0] ?? "",
      id:
        props.stateStatus?.formLayout?.id ??
        props.stateStatus?.detailLayout?.id ??
        "",
      preview: "",
      isLoading: false,
      data: {},
      dataMore: {},
      values: {
        round_range: [{}],
        sponsors: [
          {
            sponsor_type_id: "",
            quanity: undefined,
            sponsor_items: [],
          },
        ],
      },
      errors: [],
      channels: [],
      tags: {},
      tagInput: {},
      tagName: "",
      inputTag: "",
      isAlert: {
        status: false,
        type: "",
        message: "",
      },
      isTeam: false,
      kpiMonth: [],
      tabPlatForm: "youtube",
      tabEvent: this.props?.tabPlatformActive ?? "",
      readOnly: [],
      prevValues: {},
      tab: 0,
      checked: [],
      hiddenField: [],
      morekeys: [],
      numberErrTab: {},
      tagsInput: [],
      fields: this.props.fields,
    };
  }

  async componentDidMount() {
    this._isMounted = true;
    //Check readOnly field
    let allFields = this.props.fields;
    let readOnlyField = this.props.fields.filter((field) => field?.readOnly).map((field) => field.key);
    let _preview = this.state?.preview ?? {};
    let _result = {};
    if (this.props.stateStatus?.formLayout?.type == "Profile") {
      let _result;
      _result = await fetchApi(process.env.PREFIX_API + "me", this.props.stateAccount.access_token);

      if (typeof _result === "object") {
        this._isMounted && this.setState({ values: { ..._result?.result } });
      }
    }

    // Default
    if (this.state.id != "" && !this.props?.router?.query?.token) {
      let _url = process.env.PREFIX_API + this.state.module;
      _result = await fetchApi(_url + "/" + this.state.id, this.props.stateAccount.access_token);
      if (typeof _result === "object") {
        if (_result?.tags) {
          this._isMounted && this.setState({tags: { ...this.state.tags, ["tags"]: _result.tags.split(",") }});
        }

        // SET PREVIEW
        if (_result?.data) {
          Object.entries(_result?.data).forEach(function (v) {
            let _key = v[0];
            let _findIndex = _.findIndex(allFields, { key: _key });
            if (_findIndex !== -1 && allFields[_findIndex].type == "image") {
              _preview = {
                ..._preview,
                [`${_key}`]: v[1] ? (allFields[_findIndex]?.cdn ?? process.env.CDN_URL_S3) + v[1] : "",
              };
            }
            if (_findIndex !== -1 && allFields[_findIndex].type == "multi_image") {
              _preview = {..._preview, [`${_key}`]: v[1] ? v[1] : {}};
            }
            if (_findIndex !== -1 && allFields[_findIndex].type == "video") {
              _preview = {
                ..._preview,
                [`${_key}`]: v[1] ? (allFields[_findIndex]?.cdn ?? process.env.CDN_URL_S3) + v[1] : "",
              };
            }
          });
        }

        // SET METADATA_CONFIG
        if (_result?.data && _result?.data?.metadata_config) {
          Object.entries(_result?.data?.metadata_config).forEach(function (v) {
            let _key = `metadata_config.${v[0]}`;
            let _findIndex = _.findIndex(allFields, { key: _key });
            if (_findIndex !== -1 && allFields[_findIndex].type == "image") {
              _preview = {
                ..._preview,
                [`${_key}`]: v[1]
                  ? (allFields[_findIndex]?.cdn ?? process.env.CDN_URL_S3) +
                    v[1]
                  : "",
              };
            }
            if (_findIndex !== -1 && allFields[_findIndex].type == "color") {
              _result.data = { ..._result.data, [`${_key}`]: v };
            }
          });
        }

        // SET METADATA_EXPORT
        if (_result?.data && _result?.data?.metadata_export)
          _result.data.metadata_export = JSON.parse(
            _result.data.metadata_export
          );

        // SET SOURCE FOR invitation_template_render
        if (_result?.data && _result?.data?.invitation_template_render) {
          this.handleSource(
            "template",
            500,
            (allFields[_findIndex]?.cdn ?? process.env.CDN_URL_S3) +
              _result.data.invitation_template_render,
            false
          );
        }

        this._isMounted && this.setState({ values: { ..._result.data } });
      } else {
        if (_specialModule.includes(this.state.module) == false)
          Router.push("/" + this.state.module);
      }
    }
    await this.handleGetData(_result, allFields);
    const tabName = this.props?.router?.query?.tab ?? null;
    if (tabName !== null)
      this._isMounted && this.setState({ tabPlatForm: tabName });
    this._isMounted &&
      this.setState({ readOnly: readOnlyField, preview: _preview });
  }

  async handleGetData(_result, allFields) {
    let _data = _result?.data ?? {};
    let _datas = [];
    // GET DATA
    if (this.props.getData && !this.props?.router?.query?.token) {
      for await (const [key, value] of Object.entries(this.props.getData)) {
        let _result = [];
        if (isArray(value)) {
          value.map((i) => {
            i["name"] = i["name"] ?? i["label"];
            i["id"] = i["id"] ?? i["value"];
            return i;
          });
          _result = { status: "success", data: value };
        } else {
          let _url = value.indexOf("http") >= 0 ? value : process.env.PREFIX_API + value;
          _result = await fetchApi(_url, this.props.stateAccount.access_token);
        }
        if (_result?.status == "success") {
          _datas[key] = _result?.items ?? _result?.data ?? {};
          let _findIndex = _.findIndex(this.props.fields, { key: key });
          let _defaultValue = this.props?.fields[_findIndex]?.values && this.props?.fields[_findIndex]?.values.length > 0
              ? this.props?.fields[_findIndex]?.values[0].value : null;
          _data[key] = typeof _data[key] !== "undefined" && _data[key] != null ? _data[key] : _defaultValue != null
              ? _defaultValue : this.props.fields[_findIndex]?.type == "select_multi"
              ? [_datas[key][0]?.id] : [_datas[key][0]?.id] ?? "";
          await this.handleGetCustomfields(key, _datas[key], _data[key]);
        }
      }
    }
    let _dataMore = this.state.dataMore;
    if (this.props.getDataMore && !this.props?.router?.query?.token) {
      for await (const [key, _func] of Object.entries(this.props.getDataMore)) {
        let _result = await _func(this.props.stateAccount.access_token);
        _dataMore[key] = _result;
      }
    }
    this._isMounted && this.setState(
      {data: { ..._datas }, values: { ..._data }, dataMore: { ..._dataMore }},
        async () => {
          await Promise.all(
            Object.entries(_data).map(async (v) => {
              let _key = v[0];
              let _findIndex = _.findIndex(allFields, { key: _key });
              if (_findIndex !== -1 && allFields[_findIndex]?.onForChange) {
                let _id = _data[_key] ?? [_datas[_key][0]?.id ?? null];
                await this.handleOnForChange(
                  _findIndex,
                  allFields[_findIndex]?.onForChange,
                  _id,
                  _data
                );
              }
            })
          );
          await this.handleHiddenFields(_data);
        }
      );
  }

  // question
  async handleOnForChange(_index, _onForChange, _id, _data) {
    let _func = _onForChange?.func;
    console.log(_func);
    let _keys = _onForChange["key"].split(",");
    for await (const idx of Object.keys(_keys)) {
      let _key = _keys[idx];
      let _result = await _func(_id, this.props.stateAccount.access_token);
      let _defaultData = _data[_key] ?? (_result && _result.length > 0 && _result[0]?.id ? _result[0].id : null);
      _data[_key] = _defaultData;
      if (_result && _result.length > 0 && _defaultData !== null) {
        this._isMounted && this.setState(
            {
              data: { ...this.state.data, [_key]: _result },
              values: { ...this.state.values, [_key]: _defaultData },
            },
            async () => {
              await this.handleGetCustomfields(_key, _result, _defaultData);
              let _findIndex = _.findIndex(this.props.fields, { key: _key });
              if (this.props?.fields[_findIndex]?.onForChange) {
                this.handleOnForChange(
                  _findIndex,
                  this.props?.fields[_findIndex]?.onForChange,
                  _defaultData,
                  _data
                );
              }
              await this.handleHiddenFields(_data);
            }
          );
      }
    }
  }

  async handleHiddenFields(_data) {
    let hiddenFieldConfigs = this.props.hiddenFieldConfigs;
    let hiddenField = this.props.fields.filter((field) => field?.hidden).map((field) => field.key);
    if (_data) {
      let _dataMore = this.state.dataMore;
      Object.entries(_data).forEach(function (v) {
        let _key = v[0];
        let _index = _.findIndex(hiddenFieldConfigs, { key: _key });
        if (_index !== -1) {
          Object.entries(hiddenFieldConfigs[_index].values).length > 0 &&
            hiddenFieldConfigs[_index].values.forEach(async (item) => {
              if (item.dataMore) item.values = _dataMore[item.dataMore];
              let _isSuccess = true;
              if (
                hiddenFieldConfigs[_index].and &&
                Object.entries(hiddenFieldConfigs[_index].and).length > 0
              ) {
                hiddenFieldConfigs[_index].and.forEach(async (condition) => {
                  Object.entries(condition.values).length > 0 &&
                    condition.values.forEach(async (i) => {
                      if (i.keyTagertId == item.keyTagertId) {
                        _isSuccess = false;
                        if (i.dataMore) i.values = _dataMore[i.dataMore];
                        if (
                          Object.entries(i.values).length > 0 &&
                          i.values.includes(_data[condition.key])
                        ) {
                          _isSuccess = true;
                        } else {
                          _isSuccess = false;
                        }
                      }
                    });
                });
              }
              if (_isSuccess && Object.entries(item.values).length > 0 && item.values.includes(v[1])) {
                Object.entries(hiddenFieldConfigs[_index].keyTagert[item.keyTagertId]).length > 0 &&
                  hiddenFieldConfigs[_index].keyTagert[item.keyTagertId].forEach((keyTagert) => {
                    hiddenField = hiddenField.filter((field) => field != keyTagert);
                  });
                hiddenFieldConfigs[_index]?.keyTagertHidden &&
                  Object.entries(hiddenFieldConfigs[_index].keyTagertHidden[item.keyTagertId]).length > 0 &&
                  hiddenFieldConfigs[_index].keyTagertHidden[
                    item.keyTagertId
                  ].forEach((keyTagert) => {
                    !hiddenField.includes(keyTagert) &&
                      hiddenField.push(keyTagert);
                    if (!hiddenFieldConfigs[_index]?.keyParent) {
                      _hiddenFieldParent.push(keyTagert);
                    }
                  });
              }
            });
        }
      });
    }
    this._isMounted && this.setState({ hiddenField });
  }

  async handleGetCustomfields(_key, _data, _defaultData) {
    let morekeys = [];
    if (this.props.customFieldConfigs && !this.props?.router?.query?.token) {
      for (const [key] of Object.entries(this.props.customFieldConfigs)) {
        if (key == _key) {
          const _findKey = _.findIndex(_data, { id: _defaultData });
          let _morekeys = _data?.[_findKey]?.fields
            ? JSON.parse(_data?.[_findKey]?.fields)
            : [];
          _morekeys.length > 0 &&
            _morekeys.forEach((v) => {
              v.tabKey = "content";
            });
          morekeys = _morekeys;
          this._isMounted && this.setState({ morekeys });
        }
      }
    }
  }

  async handleGetCustomfieldDatas(_key, _value) {
    if (this.props.customFieldConfigs && !this.props?.router?.query?.token) {
      for (const [key, value] of Object.entries(
        this.props.customFieldConfigs
      )) {
        if (key == _key && value == "") {
          find = this.state.data?.[_key]?.find((val) => val.id == _value);
          if (find) {
            let _morekeys = find.fields ? JSON.parse(find.fields) : [];
            _morekeys.length > 0 &&
              _morekeys.forEach((v) => {
                v.tabKey = "content";
              });
            this._isMounted &&
              this.setState({ ...this.state, morekeys: _morekeys });
          }
        }
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.values["fields"] &&
      this.state.values["fields"]?.length > 0 &&
      this.state.values["fields"] != prevState.values["fields"]
    ) {
      this.state.values["fields"].map((value, index) => {
        if (value.type == "select") {
          this.setState({ [value.key]: value.option });
        }
      });
    }
  }
  componentWillUnmount() {
    this._isMounted = false;
  }

  handleFormLayout = () => {
    let _value = !this.props.stateStatus.formLayout;
    this.props.setFormLayout(_value);
  };
  handleDetailLayout = () => {
    let _value = !this.props.stateStatus.detailLayout;
    this.props.setDetailLayout(_value);
  };

  handleOpenAlert = (type, message) => {
    this.setState({
      isAlert: {
        ...this.state.isAlert,
        status: true,
        type: type,
        message: message,
      },
    });
  };

  handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    this.setState({ isAlert: { ...this.state.isAlert, status: false } });
  };

  handleUpload = (e) => {
    let _err = this.state.errors;
    let _findKey = _.findIndex(_err, { key: e.currentTarget?.name });
    // console.log("check: ",_findKey);
    delete _err[_findKey];
    if (
      e.currentTarget.files[0].size / 1000 >= 2000 &&
      e.currentTarget.files[0].type.indexOf("http") >= 0
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
          : this.state.preview[e.currentTarget.name];
      this._isMounted &&
        this.setState({
          oldFile: _oldFile,
          preview: {
            ...this.state.preview,
            [e.currentTarget.name]: URL.createObjectURL(
              e.currentTarget.files[0]
            ),
          },
        });
      let _reader = new FileReader();
      let _name = e.currentTarget.name;
      _reader.onload = (e) => {
        this._isMounted &&
          this.setState({
            values: { ...this.state.values, [_name]: e.target.result },
          });
        if (_name == "invitation_template") {
          this.handelDeleteObject("template");
          this.handleSource("template", 500, e.target.result, false);
        }
      };
      _reader.readAsDataURL(e.currentTarget.files[0]);
    }
  };

  handleUploadImages = (e) => {
    let _err = this.state.errors;
    let _findKey = _.findIndex(_err, { key: e.currentTarget?.name });
    delete _err[_findKey];
    let _name = e.currentTarget.name;
    let image_preview = [];
    if (this.state.preview[_name]?.length > 0) {
      image_preview = [...this.state.preview[_name]];
    }
    let image_value = [];
    if (this.state.values[_name]?.length > 0) {
      image_value = [...this.state.values[_name]];
    }
    for (let image of e.currentTarget.files) {
      if (image.size / 1000 >= 2000 && image.type.indexOf("image") >= 0) {
        _err.push({
          key: e.currentTarget?.name,
          msg: "Hình ảnh phải nhỏ hơn < 2Mb",
        });
        this.setState({ errors: _err });
        return;
      }
      if (e.currentTarget?.name) {
        const blob = { link: URL.createObjectURL(image) };
        image_preview.push(blob);
        let _reader = new FileReader();
        _reader.onload = (e) => {
          image_value.push({ file: e.target.result, ...blob });
        };
        _reader.readAsDataURL(image);
      }
    }
    this._isMounted &&
      this.setState({
        preview: {
          ...this.state.preview,
          [e.currentTarget.name]: image_preview,
        },
        values: { ...this.state.values, [_name]: image_value },
      });
  };

  handleDeleteImage = (e) => {
    e.preventDefault();
    let _name = e.currentTarget.dataset.name;
    let image_preview = [...this.state.preview[_name]];
    let image_value = [...this.state.values[_name]];
    if (e.currentTarget?.id !== "") {
      _.remove(image_preview, { id: parseInt(e.currentTarget.id) });
      let _fieldKey = _.findIndex(image_value, {
        id: parseInt(e.currentTarget.id),
      });
      image_value[_fieldKey] = {
        id: parseInt(e.currentTarget.id),
        delete: true,
      };
    } else if (e.currentTarget?.dataset?.link !== "") {
      _.remove(image_preview, { link: e.currentTarget.dataset.link });
      _.remove(image_value, { link: e.currentTarget.dataset.link });
    }
    this._isMounted &&
      this.setState({
        preview: { ...this.state.preview, [_name]: image_preview },
        values: { ...this.state.values, [_name]: image_value },
      });
  };

  handleChangeValue = async (e) => {
    let _value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    let _err = this.state.errors;
    let _findKey = _.findIndex(_err, { key: e.target?.name });
    let _fieldKey = _.findIndex(this.props.fields, { key: e.target?.name });
    const values = this.state.values;

    if (_value != "") {
      delete _err?.[_findKey];
      const _numberErrTab = this.state.numberErrTab;
      if (this.props.fields[_fieldKey]?.tabKey && _findKey > -1) {
        _numberErrTab[this.props.fields[_fieldKey].tabKey] =
          this.state.numberErrTab?.[this.props.fields[_fieldKey].tabKey] - 1 ??
          0;
      }
      this.setState({ errors: _err, numberErrTab: _numberErrTab });
    }

    if (e.target.type == "number" && (e.target.max || e.target.min)) {
      const val = parseInt(_value);
      if (parseInt(e.target.max) && parseInt(e.target.max) < val)
        _value = parseInt(e.target.max);
      if (parseInt(e.target.min) && parseInt(e.target.min) > val)
        _value = parseInt(e.target.min);
    }

    if (this.props.fields[_fieldKey]?.key == "round_count" && _value != "") {
      if (this.state.values["round_range"]?.length > _value) {
        this.setState({
          values: {
            ...this.state.values,
            round_range: this.state.values["round_range"].slice(0, _value),
          },
        });
      } else if (this.state.values["round_range"]?.length < _value) {
        const _Arr = [
          ...Array(
            parseInt(_value - this.state.values["round_range"].length)
          ).keys(),
        ]?.map(() => ({}));
        this.setState({
          values: {
            ...this.state.values,
            round_range: [...this.state.values["round_range"], ..._Arr],
          },
        });
      }
    }

    if (this.props.fields[_fieldKey]?.key == "add_avatar") {
      if (_value == true) {
        this.handleSource(
          "avatar",
          200,
          "data:image/png;base64,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",
          true
        );
      } else if (_value == false) {
        this.handelDeleteObject("avatar");
      }
    }
    if (this.props.fields[_fieldKey]?.key == "add_name") {
      if (_value == true) {
        this.handleSource(
          "name",
          50,
          "data:image/png;base64,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",
          true
        );
      } else if (_value == false) {
        this.handelDeleteObject("name");
      }
    }
    if (this.props.fields[_fieldKey]?.key == "add_position") {
      if (_value == true) {
        this.handleSource(
          "position",
          50,
          "data:image/png;base64,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",
          true
        );
      } else if (_value == false) {
        this.handelDeleteObject("position");
      }
    }
    if (this.props.fields[_fieldKey]?.key == "add_qr") {
      if (_value == true) {
        this.handleSource(
          "qr_code",
          200,
          "data:image/png;base64,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",
          true
        );
      } else if (_value == false) {
        this.handelDeleteObject("qr_code");
      }
    }

    //Get CustomfieldData
    await this.handleGetCustomfieldDatas(e.target.name, _value);

    //Get metadataconfig
    values[e.target.name] = _value;

    if (e.target.name.split(".")?.length > 1) {
      let _key = "";
      const _val = values[e.target.name.split(".")[0]] || {};
      e.target.name.split(".").forEach((key, ind, arr) => {
        if (ind == 0) {
          _key = key;
        } else if (ind == arr.length - 1) _val[key] = _value;
        else _val[key] = _val[key] ?? {};
      });
      values[_key] = _val;
      delete values[e.target.name];
    }

    this.setState({ values }, async () => {
      if (this.props.fields[_fieldKey]?.onForChange) {
        await this.handleOnForChangeOnChange(
          _fieldKey,
          this.props.fields[_fieldKey]?.onForChange,
          _value
        );
      }
      await this.handleHiddenFields(this.state.values);
    });
  };

  async handleOnForChangeOnChange(_fieldKey, _onForChange, _value) {
    let _func = _onForChange?.func;
    let _keys = _onForChange["key"].split(",");
    for await (const key of Object.keys(_keys)) {
      let _key = _keys[key];
      let _result = await _func(_value, this.props.stateAccount.access_token);
      _result &&
        _result.length > 0 &&
        this._isMounted &&
        this.setState(
          {
            data: { ...this.state.data, [_key]: _result },
            values: { ...this.state.values, [_key]: _result[0].id },
          },
          async () => {
            let _findIndex = _.findIndex(this.props.fields, { key: _key });
            if (this.props?.fields[_findIndex]?.onForChange) {
              await this.handleOnForChangeOnChange(
                _findIndex,
                this.props?.fields[_findIndex]?.onForChange,
                _result[0].id
              );
            }
            await this.handleHiddenFields(this.state.values);
          }
        );
    }
  }
  async handleHiddenFieldsOnchange(_data) {
    let _dataMore = this.state.dataMore;
    if (hiddenFieldConfigs) {
      let hiddenFieldConfigs = hiddenFieldConfigs;
      let _index = _.findIndex(hiddenFieldConfigs, { key: e.target?.name });
      if (_index !== -1) {
        Object.entries(hiddenFieldConfigs[_index].values).length > 0 &&
          hiddenFieldConfigs[_index].values.forEach((item) => {
            if (item.dataMore) item.values = _dataMore[item.dataMore];
            let _isSuccess = true;
            if (
              hiddenFieldConfigs[_index].and &&
              Object.entries(hiddenFieldConfigs[_index].and).length > 0
            ) {
              hiddenFieldConfigs[_index].and.forEach(async (condition) => {
                Object.entries(condition.values).length > 0 &&
                  condition.values.forEach(async (i) => {
                    if (i.keyTagertId == item.keyTagertId) {
                      _isSuccess = false;
                      if (i.dataMore) i.values = _dataMore[i.dataMore];
                      if (
                        Object.entries(i.values).length > 0 &&
                        i.values.includes(this.state.values[condition.key])
                      ) {
                        _isSuccess = true;
                      } else {
                        _isSuccess = false;
                      }
                    }
                  });
              });
            }
            if (
              _isSuccess &&
              Object.entries(item.values).length > 0 &&
              item.values.includes(_value)
            ) {
              Object.entries(
                hiddenFieldConfigs[_index].keyTagert[item.keyTagertId]
              ).length > 0 &&
                hiddenFieldConfigs[_index].keyTagert[item.keyTagertId].forEach(
                  (keyTagert) => {
                    hiddenField = hiddenField.filter(
                      (field) => field != keyTagert
                    );
                  }
                );
            } else {
              Object.entries(
                hiddenFieldConfigs[_index].keyTagert[item.keyTagertId]
              ).length > 0 &&
                hiddenFieldConfigs[_index].keyTagert[item.keyTagertId].forEach(
                  (keyTagert) => {
                    !hiddenField.includes(keyTagert) &&
                      hiddenField.push(keyTagert);
                  }
                );
            }
          });
      }
    }
  }
  handleChangeSelect = async (e) => {
    let _value = e.target.value;
    let _err = this.state.errors;
    let _findKey = _.findIndex(_err, { key: e.target?.name });
    let _fieldKey = _.findIndex(this.props.fields, { key: e.target?.name });
    if (_value != "") {
      delete _err[_findKey];
      const _numberErrTab = this.state.numberErrTab;
      if (this.props.fields[_fieldKey]?.tabKey && _findKey > -1) {
        _numberErrTab[this.props.fields[_fieldKey].tabKey] =
          this.state.numberErrTab?.[this.props.fields[_fieldKey].tabKey] - 1 ??
          0;
      }
      this.setState({ errors: _err, numberErrTab: _numberErrTab });
    }
    this.setState({
      values: {
        ...this.state.values,
        [e.target.name]:
          typeof _value === "string" ? _value.split(",") : [..._value],
      },
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    let allFields = this.props.fields;
    let _form = document.getElementById("form");
    let _data = new FormData(_form);
    if (this.state.isLoading == false) {
      this.setState({ isLoading: true });
      let _obj = {};
      _data.forEach((val, key) => {
        let _findIndex = _.findIndex(this.props.fields, { key: key });
        if (this.props?.fields[_findIndex]?.type == "status") {
          val = this.state.values[key] == true || val == "on" ? true : false;
        }
        if (this.props?.fields[_findIndex]?.type == "image") {
          if (_data.get(key).name != "" && this.state.values[key] != "") {
            val = {
              file: this.state.values[key],
              name: _data.get(key).name,
            };
            if (this.state.id != "" && this.state.oldFile)
              val["oldFile"] = this.state.oldFile.replace(
                process.env.CDN_URL,
                ""
              );
          } else if (key.split(".").length > 1) {
            key.split(".").forEach((k, ind) => {
              if (ind == 0) val = this.state.values[k];
              else val = val?.[k] ?? "";
            });
          } else val = "";
        }
        if (this.props?.fields[_findIndex]?.type == "video") {
          if (_data.get(key).name != "" && this.state.values[key] != "") {
            val = {
              file: this.state.values[key],
              name: _data.get(key).name,
            };
            if (this.state.id != "" && this.state.oldFile)
              val["oldFile"] = this.state.oldFile.replace(
                process.env.CDN_URL,
                ""
              );
          } else val = this.state.values[key] ?? "";
        }
        if (this.props?.fields[_findIndex]?.type == "multi_image") {
          val = this.state.values[key] ?? "";
        }
        if (
          this.state.values[key] &&
          this.props?.fields[_findIndex]?.type == "date"
        ) {
          val = new Date(this.state.values[key]);
        }
        if (
          this.state.values[key] &&
          this.props?.fields[_findIndex]?.type == "dateTime"
        ) {
          val = new Date(this.state.values[key]);
        }
        if (this.props?.fields[_findIndex]?.type == "tags") {
          if (
            this.state.tags[this.props?.fields[_findIndex].key] &&
            this.state.tags[this.props?.fields[_findIndex].key].length > 0
          ) {
            val = _.join(
              this.state.tags[this.props?.fields[_findIndex].key],
              ","
            );
          } else val = "";
        }
        if (
          this.props?.fields[_findIndex]?.type == "autoComplete" ||
          this.props?.fields[_findIndex]?.type == "select_multi"
        ) {
          val = this.state.values[key] ? this.state.values[key] : val;
        }
        if (key.split(".").length > 1) {
          let _val = _obj[key.split(".")[0]] || {};
          key.split(".").forEach((k, ind, arr) => {
            if (ind == arr.length - 1) _val[k] = val;
            else if (ind > 0) _val[k] = {};
          });
          _obj[key.split(".")[0]] = _val;
        } else _obj[key] = val && val ? val : undefined;
      });

      allFields.forEach((v) => {
        if (v.type == "status")
          _obj[v.key] =
            this.state.values[v.key] == true || _obj[v.key] == "on"
              ? true
              : false;
      });

      if (
        this.props.stateStatus?.formLayout?.type == "Profile" &&
        _obj["avatar"] == ""
      )
        delete _obj["avatar"];

      //Remove object empty
      if (this.state?.fieldNotForm)
        for (let _key in _obj) {
          if (this.props.fieldNotForm.includes(_key)) {
            delete _obj[_key];
          }
        }
      let _result;
      let _url = process.env.PREFIX_API + this.state.module;

      if (this.props.stateStatus?.importLayout.status) {
        _url += "/import";
        _result = await postApi(
          _url,
          _obj,
          this.props.stateAccount.access_token
        );
      } else if (this.props.stateStatus?.formLayout?.type == "Profile") {
        _result = await putApi(
          process.env.PREFIX_API + "me",
          _obj,
          this.props.stateAccount.access_token
        );
      } else if (this.state.id == "") {
        _result = await postApi(
          _url,
          _obj,
          this.props.stateAccount.access_token
        );
      } else {
        let _add = "";
        _result = await putApi(
          _url + "/" + this.state.id + _add,
          _obj,
          this.props.stateAccount.access_token
        )
          .then((resp) => resp)
          .catch((e) => e);
      }
      if (_result == "" || _result?.status == "success") {
        if (
          this.state.id == "" &&
          this.props.stateStatus?.formLayout?.type &&
          this.props.stateStatus?.formLayout?.type != "Profile"
        ) {
          this._isMounted && this.props.handleSuccess("Thêm mới thành công");
          setTimeout(() => {
            this._isMounted && this.setState({ isLoading: false, errors: [] });
            Router.push("/" + this.state.module);
          }, 1000);
        } else if (this.props.stateStatus.importLayout.status == true) {
          this._isMounted && this.props.handleSuccess("Import thành công");
          setTimeout(() => {
            this._isMounted && this.setState({ isLoading: false, errors: [] });
            Router.push("/" + this.state.module);
          }, 1000);
        } else {
          this._isMounted && this.props.handleSuccess("Cập nhật thành công");
          setTimeout(() => {
            this._isMounted && this.setState({ isLoading: false, errors: [] });
            if (!this.props.stateStatus?.formLayout?.type) {
              Router.push("/" + this.state.module);
            }
            //this.props.stateStatus.formLayout.get();
          }, 1000);
          if (
            this.props.stateStatus?.formLayout?.type &&
            this.props.stateStatus?.formLayout?.type == "Profile"
          ) {
            this.props.updateProfile({
              nickname: this.state.values?.nickname ?? "",
              avatar: this.state.preview,
            });
          }
        }
        this.props.setFormLayout(false);
        this.props.setImportLayout(false);
      } else {
        if (typeof _result.response.data.errors?.msg === "string") {
          this._isMounted &&
            this.props.handleFailure(_result.response.data.errors.msg);
        } else {
          let _numErrTab = {};
          if (
            _result.response.data.errors?.length > 0 &&
            this.props.tabPlatform
          ) {
            _result.response.data.errors.forEach((item) => {
              const indKey = _.findIndex(this.props.fields, { key: item.key });
              if (indKey > -1 && this.props.fields[indKey]?.tabKey) {
                _numErrTab[this.props.fields[indKey].tabKey] =
                  (_numErrTab?.[this.props.fields[indKey].tabKey] ?? 0) + 1;
              }
            });
          }
          this._isMounted &&
            this.setState({
              errors: _result.response.data.errors,
              numberErrTab: _numErrTab,
            });
        }
        this._isMounted && this.setState({ isLoading: false });
      }
    }
  };

  handleTags = (tags) => {
    this.setState({
      tags: { ...this.state.tags, [this.state.tagName]: tags },
      tagInput: { ...this.state.tagInput, [this.state.tagName]: null },
    });
  };

  handleToggle = (key) => {
    const poll_item = this.state.checked?.find((pitem) => pitem == key);
    if (poll_item) {
      this.setState({
        ...this.state,
        checked: [...this.state.checked?.filter((poll) => poll != key)],
      });
    } else {
      // this.state.values.poll_item_ids.push(key)
      this.setState({
        ...this.state,
        checked: [...this.state.checked, key],
      });
    }
  };

  handleTagChange = (e) => {
    this.setState(
      {
        tagInput: { ...this.state.tagInput, [e.target.name]: e.target.value },
        tagName: e.target.name,
      },
      () => {
        if (e.target.value == "") delete this.state.tagInput[e.target.name];
      }
    );
  };

  handlePlatForm = async (e) => {
    let _name = e.currentTarget.dataset.platform;
    this.setState({ tabPlatForm: _name });
  };

  handleTabEvent = (e, newValue) => {
    this.setState({ tabEvent: newValue });
  };

  handleSource = (id, scaleToHeight, image, selectable) => {
    var container = document.getElementById("canvas-wrapper");
    let canvasfabic;
    if (this.state.fabric == undefined) {
      canvasfabic = new fabric.Canvas("canvasdialog");
      canvasfabic.setWidth(container.clientWidth);
      canvasfabic.setHeight(container.clientHeight);
    } else {
      canvasfabic = this.state.fabric;
    }
    fabric.Image.fromURL(image, function (oImg) {
      oImg.set({
        selectable: selectable,
        id: id,
        evented: id == "template" ? false : true,
      });
      if (oImg.height > oImg.width && id == "template") {
        oImg.scaleToHeight(container.clientHeight);
      } else if (id == "template") {
        oImg.scaleToWidth(container.clientWidth);
      } else {
        oImg.scaleToHeight(scaleToHeight);
      }
      canvasfabic.preserveObjectStacking = true;
      canvasfabic.centerObject(oImg);
      canvasfabic.add(oImg);
      canvasfabic.renderAll();
    });
    this.setState({ fabric: canvasfabic });
  };

  handelDeleteObject = (id) => {
    let canvasfabic;
    if (this.state?.fabric) {
      canvasfabic = this.state.fabric;
      canvasfabic.forEachObject(function (object) {
        if (object.id == id) {
          canvasfabic.remove(object);
        }
      });
    }
  };

  getInvitationPosition = async () => {
    return new Promise((resolve, reject) => {
      try {
        let canvasfabic;
        if (this.state.fabric == undefined) {
          resolve(false);
        } else {
          canvasfabic = this.state.fabric;

          var metadata = {};
          var itemlist = {};
          canvasfabic.forEachObject(function (object) {
            // Get the position of the object
            var position = object.getBoundingRect();
            var center_point = object.getCenterPoint();
            itemlist[object.id] = {
              ...position,
              fullWidth: object.width,
              fullHeight: object.height,
              center_point: center_point,
            };
          });
          for (const [key, value] of Object.entries(itemlist)) {
            if (key !== "template") {
              metadata[key] = {
                left:
                  ((value.left - itemlist.template.left) /
                    itemlist.template.width) *
                  itemlist.template.fullWidth,
                top:
                  ((value.top - itemlist.template.top) /
                    itemlist.template.height) *
                  itemlist.template.fullHeight,
                width:
                  (value.width / itemlist.template.width) *
                  itemlist.template.fullWidth,
                height:
                  (value.height / itemlist.template.height) *
                  itemlist.template.fullHeight,
                center_point: {
                  x:
                    ((value.center_point.x - itemlist.template.left) /
                      itemlist.template.width) *
                    itemlist.template.fullWidth,
                  y:
                    ((value.center_point.y - itemlist.template.top) /
                      itemlist.template.height) *
                    itemlist.template.fullHeight,
                },
              };
            }
          }

          var dataURL = canvasfabic.toDataURL({
            format: "png",
          });

          resolve({ metadata, dataURL });
        }
      } catch (e) {
        // console.log(e);
        reject;
      }
    });
  };

  showFields = (field) => {
    let _field;
    let _findKey;
    let _errArr = this.state.errors;
    let _readOnly =
      this.props?.detail ?? this.state.readOnly?.includes(field.key);
    if (_errArr?.length > 0)
      _findKey = _.findIndex(_errArr, { key: field.key });

    let _val = this.state.values;
    let _parse = field?.key ? field.key.split(".") : {};
    let _options = [];
    let fieldAddmore = [
      { value: "input", label: "Văn bản" },
      { value: "image", label: "Hình ảnh" },
      { value: "file", label: "File" },
    ];

    switch (field.type) {
      case "status":
        _field = (
          <Switch
            name={field.key}
            onChange={this.handleChangeValue}
            checked={
              !!this.state?.values[field.key] ??
              (this.state.id == "" ? !!field.defaultValue : false)
            }
            size="small"
            className="ms-4 mb-1"
            disabled={_readOnly}
          />
        );
        break;
      case "radio":
        _field = (
          <FormControl component="fieldset">
            <RadioGroup
              id={field.key}
              aria-label={field.key}
              onChange={this.handleChangeValue}
              value={this.state?.values[field.key] ?? field.defaultValue}
              name={field.key}
              className="formCheckInline"
            >
              {field.values &&
                field.values.map((value) => (
                  <FormControlLabel
                    disabled={_readOnly}
                    key={value}
                    value={value}
                    control={<Radio />}
                    label={value}
                  />
                ))}
            </RadioGroup>
          </FormControl>
        );
        break;
      case "select":
        _field = (
          <FormControl fullWidth className="selectCustom">
            <Select
              value={
                this.state?.values[field.key] ??
                field.defaultValue ??
                (field?.values && field?.values?.length > 0 ? "" : "")
              }
              onChange={this.handleChangeValue}
              name={field.key}
              error={_findKey >= 0 ? true : false}
              disabled={_readOnly}
            >
              {field.key.indexOf("metadata") != -1 &&
              this.state.values.fieldData &&
              this.state.values.fieldData?.length > 0
                ? this.state.values.fieldData[0]?.option.map((v, k) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))
                : field.values &&
                  field.values.map((v) => (
                    <MenuItem key={v.value} value={v.value}>
                      {field.showIcon && (
                        <i class={v.value} style={{ marginRight: 4 }}></i>
                      )}{" "}
                      {" " + v.label}
                    </MenuItem>
                  ))}
              {this.state.data[field.key] &&
                this.state.data[field.key].map((value) => (
                  <MenuItem key={value.id} value={value.id}>
                    {field?.mapField
                      ? value[field?.mapField]
                      : value.name
                      ? value.name
                      : value.title
                      ? value.title
                      : value.full_name}
                  </MenuItem>
                ))}
            </Select>
            <FormHelperText>
              {_findKey >= 0 ? _errArr[_findKey].msg : ""}
            </FormHelperText>
          </FormControl>
        );
        break;
      case "select_multi":
        let value = this.state?.values[field.key] ?? [];
        if (!isArray(this.state?.values[field.key]))
          value = [this.state?.values[field.key]];
        _field = (
          <FormControl fullWidth className="selectCustom">
            <Select
              displayEmpty
              multiple
              value={value}
              onChange={this.handleChangeSelect}
              name={field.key}
              error={_findKey >= 0 ? true : false}
              disabled={_readOnly}
            >
              {field.values &&
                field.values.map((v) => (
                  <MenuItem key={v.value} value={v.value}>
                    {v.label}
                  </MenuItem>
                ))}
              {this.state.data[field.key] &&
                this.state.data[field.key]?.length > 0 &&
                this.state.data[field.key].map((value) => (
                  <MenuItem key={value.id} value={value.id}>
                    {field?.mapField
                      ? value[field?.mapField]
                      : value.name
                      ? value.name
                      : value.title
                      ? value.title
                      : value.full_name}
                  </MenuItem>
                ))}
            </Select>
            <FormHelperText>
              {_findKey >= 0 ? _errArr[_findKey].msg : ""}
            </FormHelperText>
          </FormControl>
        );
        break;
      case "image":
        _field = (
          <div
            className={"avatarUpload mt-2 " + (_findKey >= 0 ? "error" : "")}
          >
            <div
              className={"img " + (this.state.preview[field.key] ? "" : "show")}
            >
              <Image
                src={
                  this.state.preview[field.key]
                    ? this.state.preview[field.key]
                    : "/images/transparent.png"
                }
                alt="Picture of the author"
                className="img-cover"
                layout="fill"
              />

              {!_readOnly && (
                <label
                  htmlFor={field.key}
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
              {this.state.preview[field.key] && (
                <label
                  htmlFor={field.key}
                  className="btnInputFile btndowload"
                  onClick={(e) => {
                    e.preventDefault();
                    FileSaver.saveAs(this.state.preview[field.key], "dowload");
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
              accept="/public/upload/**"
              className="inputFile"
              name={field.key}
              id={field.key}
              type="file"
              onChange={this.handleUpload}
            />
            <p className="MuiFormHelperText-root">
              {_findKey >= 0 ? _errArr[_findKey].msg : ""}
            </p>
          </div>
        );
        break;
      case "multi_image":
        _field = (
          <>
            <div
              className={"multi-image mt-2 " + (_findKey >= 0 ? "error" : "")}
            >
              {this.state.preview[field.key] && this.state.preview[field.key].map((value, key) => (
                  <div
                    key={key}
                    className={
                      "img " + (this.state.preview[field.key] ? "" : "show")
                    }
                  >
                    <Image
                      src={
                        value?.image_link
                          ? ((field?.cdn ?? process.env.API_URL) + value.image_link)
                          : value?.link
                          ? value.link
                          : "/images/transparent.png"
                      }
                      alt="Picture of the author"
                      className="img-cover"
                      layout="fill"
                    />
                    {value && (
                      <label
                        className="btnInputFile"
                        id={value?.id ? value?.id : ""}
                        data-link={value?.link ? value.link : ""}
                        data-name={field.key}
                        onClick={this.handleDeleteImage}
                      >
                        <IconButton
                          color="primary"
                          aria-label="dowload picture"
                          component="span"
                        >
                          <i className="fal fa-trash"></i>
                        </IconButton>
                      </label>
                    )}
                  </div>
                ))}
              <div
                className={
                  "img " + (this.state.preview[field.key] ? "" : "show")
                }
              >
                <Image
                  src={"/images/transparent.png"}
                  alt="Picture of the author"
                  className="img-cover"
                  layout="fill"
                />

                {!_readOnly && (
                  <label
                    htmlFor={field.key}
                    className="btnInputFile"
                    // onChange={this.handleUpload}
                  >
                    <IconButton
                      color="primary"
                      aria-label="upload picture"
                      component="span"
                    >
                      <i className="fal fa-plus"></i>
                    </IconButton>
                  </label>
                )}
              </div>
              <input
                accept="image/*"
                className="inputFile"
                name={field.key}
                id={field.key}
                type="file"
                multiple="multiple"
                onChange={this.handleUploadImages}
              />
              <p className="MuiFormHelperText-root">
                {_findKey >= 0 ? _errArr[_findKey].msg : ""}
              </p>
            </div>
          </>
        );
        break;
      case "textarea":
        let _value = this.state.values;
        let _par = field.key.split(".");
        if (_par.length == 2)
          _value =
            _value[_par[0]] && _value[_par[0]][_par[1]]
              ? _value[_par[0]][_par[1]]
              : "";
        else _value = _value[field.key];
        _field = (
          <TextField
            multiline
            rows={field?.row ?? 8}
            className="p-0"
            helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
            error={_findKey >= 0 ? true : false}
            name={field.key}
            value={_value}
            onChange={this.handleChangeValue}
            disabled={_readOnly}
          />
        );
        break;
      case "editor":
        _field = (
          <CustomEditor
            value={this.state.values[field.key] ?? ""}
            field={field}
          />
        );
        break;
      case "show_editor":
        _field = this.state.values["is_embed"] && (
          <CustomEditor
            value={this.state.values[field.key] ?? ""}
            field={field}
          />
        );
        break;
      case "autoComplete":
        let _key = _.findIndex(this.state.data[field.key], {
          id: this.state.values[field.key],
        });
        if (this.state?.data[field.key]) {
          _field = (
            <Autocomplete
              multiple={field.multiple == false ? false : true}
              size="small"
              options={this.state?.data[field.key] ?? []}
              getOptionLabel={(option) =>
                field?.mapField
                  ? option[field?.mapField]
                  : option?.title ?? option.name
              }
              onChange={(e, v) =>
                this.setState({
                  values: { ...this.state.values, [field.key]: v.id },
                })
              }
              defaultValue={this.state?.data[field.key][_key]}
              renderInput={(params) => (
                <TextField {...params} name={field.key} />
              )}
            />
          );
        }
        break;
      case "kolTabs":
        _field = this.state.id ? (
          <KolTabs
            id={this.state.id}
            name={field.key}
            err={_findKey >= 0 ? _errArr[_findKey].msg : ""}
          />
        ) : (
          <TextField
            multiline
            rows={field?.row ?? 8}
            className="p-0"
            helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
            error={_findKey >= 0 ? true : false}
            name={field.key}
            value={this.state.values[field.key] || ""}
            onChange={this.handleChangeValue}
          />
        );
        break;
      case "password":
        _field = (
          <TextField
            type="password"
            name={field.key}
            onChange={this.handleChangeValue}
            helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
            error={_findKey >= 0 ? true : false}
          />
        );
        break;
      case "dateTime":
        _field = (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={3}>
              <DateTimePicker
                minDate={field.minDate == true ? new Date() : ""}
                value={this.state.values[field.key] || ""}
                inputFormat="dd/MM/yyyy HH:mm"
                inputProps={{ placeholder: "dd/MM/yyyy HH:mm" }}
                onChange={(v) => {
                  if (v != "") {
                    delete _errArr[_findKey];
                    this.setState({ errors: _errArr });
                  }
                  this.setState({
                    values: { ...this.state.values, [field.key]: v },
                  });
                }}
                renderInput={(params) => {
                  if (params.inputProps.value == "") params.error = false;
                  return (
                    <TextField
                      helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
                      className={
                        "dateTime" + (_findKey >= 0 ? " tt-error" : "")
                      }
                      name={field.key}
                      disabled={_readOnly}
                      {...params}
                    />
                  );
                }}
              />
            </Stack>
          </LocalizationProvider>
        );
        break;
      case "dateTimeDMY":
        _field = (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={3}>
              <DateTimePicker
                minDate={field.minDate == true ? new Date() : ""}
                value={this.state.values[field.key] || ""}
                inputFormat="yyyy/MM/dd"
                inputProps={{ placeholder: "yyyy/MM/dd" }}
                onChange={(v) => {
                  if (v != "") {
                    delete _errArr[_findKey];
                    this.setState({ errors: _errArr });
                  }
                  this.setState({
                    values: { ...this.state.values, [field.key]: v },
                  });
                }}
                renderInput={(params) => {
                  if (params.inputProps.value == "") params.error = false;
                  return (
                    <TextField
                      helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
                      className={
                        "dateTime" + (_findKey >= 0 ? " tt-error" : "")
                      }
                      name={field.key}
                      disabled={_readOnly}
                      {...params}
                    />
                  );
                }}
              />
            </Stack>
          </LocalizationProvider>
        );
        break;
      case "date":
        _field = (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={3}>
              <DatePicker
                minDate={field.minDate == true ? new Date() : new Date().setFullYear(new Date().getFullYear() - 100)}
                value={this.state.values[field.key] || ""}
                inputFormat="dd/MM/yyyy"
                inputProps={{ placeholder: "dd/MM/yyyy" }}
                onChange={(v) => {
                  if (v != "") {
                    delete _errArr[_findKey];
                    this.setState({ errors: _errArr });
                  }
                  this.setState({
                    values: { ...this.state.values, [field.key]: v },
                  });
                }}
                disabled={_readOnly}
                renderInput={(params) => {
                  if (params.inputProps.value == "") params.error = false;
                  return (
                    <TextField
                      helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
                      className={
                        "dateTime" + (_findKey >= 0 ? " tt-error" : "")
                      }
                      name={field.key}
                      disabled={_readOnly}
                      {...params}
                    />
                  );
                }}
              />
            </Stack>
          </LocalizationProvider>
        );
        break;
      case "dateRange":
        _field = (
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            localeText={{ start: "", end: "" }}
          >
            <DateRangePicker
              className="dateRange"
              value={this.state.values[field.key] || [null, null]}
              inputFormat="dd/MM/yyyy"
              onChange={(v) => {
                if (v != "") {
                  delete _errArr[_findKey];
                  this.setState({ errors: _errArr });
                }
                if (field.renderInput && v[0] !== null && v[1] !== null) {
                  const moment = extendMoment(Moment);
                  const range = moment.range(v[0], v[1]);
                  const rangeMonths = Array.from(range.by("month")).map(
                    (el, key) => {
                      return el.format("MM-YYYY");
                    }
                  );
                  this.setState({ kpiMonth: rangeMonths });
                }
                this.setState({
                  values: { ...this.state.values, [field.key]: v },
                });
              }}
              renderInput={(startProps, endProps) => (
                <React.Fragment>
                  <TextField
                    name={field.key + "_to"}
                    {...startProps}
                    inputProps={{
                      ...startProps.inputProps,
                      placeholder: "Start",
                    }}
                  />
                  <Box sx={{ mx: 2 }}> to </Box>
                  <TextField
                    name={field.key + "_from"}
                    {...endProps}
                    inputProps={{
                      ...endProps.inputProps,
                      placeholder: "End",
                    }}
                  />
                </React.Fragment>
              )}
            />
          </LocalizationProvider>
        );
        break;
      case "player":
        _field = (
          <div className="player-wrapper">
            <ReactPlayer
              className="react-player"
              url={
                (field?.cdn ?? process.env.CDN_URL_S3) +
                this.state.values[field.key]
              }
              width="100%"
              height="100%"
              controls="true"
            />
          </div>
        );
        break;
      case "rounds":
        const value_round = this.state.values[field.key] ?? field.defaultValue;
        _field = (
          <>
            <TextField
              name={field.key}
              type="number"
              value={value_round}
              onChange={this.handleChangeValue}
              helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
              error={_findKey >= 0 ? true : false}
              inputProps={{
                max: 4,
                min: 1,
                inputMode: "numeric",
                pattern: "[1-9]*",
              }}
              disabled={_readOnly || false}
            />
          </>
        );
        break;
      case "round_range":
        const errKey_rangeTop = _.findIndex(_errArr, {
          key: `rounds[${field.index}].range_top`,
        });
        _field = (
          <>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              localeText={{ start: "", end: "" }}
            >
              <div className="row _r">
                <div className="col-lg-10">
                  <div className="row _r">
                    <div className="col-lg-4">
                      <label htmlFor={`round`} className="">
                        {`Từ ngày`}
                        <span className="ms-1 color-primary">*</span>
                      </label>
                      <DateTimePicker
                        minDateTime={
                          field.index > 0
                            ? this.state.values["round_range"]?.[
                                field.index - 1
                              ]?.["publish_date"] ?? new Date()
                            : !this.state.id
                            ? new Date()
                            : this.state.values["round_range"]?.[field.index]?.[
                                "started_at"
                              ]
                        }
                        value={
                          this.state.values["round_range"]?.[field.index]?.[
                            "started_at"
                          ] || ""
                        }
                        inputFormat="dd/MM/yyyy HH:mm"
                        inputProps={{ placeholder: "dd/MM/yyyy HH:mm" }}
                        onChange={(v) => {
                          const keyError = _.findIndex(_errArr, {
                            key: `rounds[${field.index}].started_at`,
                          });
                          const _numberErrTab = this.state.numberErrTab;
                          if (v != "" && keyError > -1) {
                            delete _errArr[keyError];
                            _numberErrTab[field.tabKey] -= 1;
                            this.setState({
                              errors: _errArr,
                              numberErrTab: _numberErrTab,
                            });
                          }
                          let round_range = this.state.values["round_range"];
                          round_range[field.index]["started_at"] = v;
                          this.setState({
                            values: { ...this.state.values, round_range },
                          });
                        }}
                        renderInput={(params) => {
                          if (params.inputProps.value == "")
                            params.error = false;
                          const keyError = _.findIndex(_errArr, {
                            key: `rounds[${field.index}].started_at`,
                          });
                          return (
                            <TextField
                              helperText={
                                keyError >= 0 ? _errArr[keyError].msg : ""
                              }
                              className={
                                "dateTime" + (keyError >= 0 ? " tt-error" : "")
                              }
                              name={field.key}
                              disabled={_readOnly}
                              {...params}
                            />
                          );
                        }}
                        disabled={
                          _readOnly ||
                          this.state.values["round_range"]?.[field.index]?.[
                            "disabled"
                          ]
                        }
                      />
                    </div>
                    <div className="col-lg-4">
                      <label htmlFor={`round`} className="">
                        {`Đến ngày`}
                        <span className="ms-1 color-primary">*</span>
                      </label>
                      <DateTimePicker
                        minDateTime={
                          this.state.values["round_range"]?.[field.index]?.[
                            "started_at"
                          ]
                        }
                        value={
                          this.state.values["round_range"]?.[field.index]?.[
                            "ended_at"
                          ] || ""
                        }
                        inputFormat="dd/MM/yyyy HH:mm"
                        inputProps={{ placeholder: "dd/MM/yyyy HH:mm" }}
                        onChange={(v) => {
                          const keyError = _.findIndex(_errArr, {
                            key: `rounds[${field.index}].ended_at`,
                          });
                          const _numberErrTab = this.state.numberErrTab;
                          if (v != "" && keyError > -1) {
                            delete _errArr[keyError];
                            _numberErrTab[field.tabKey] -= 1;
                            this.setState({
                              errors: _errArr,
                              numberErrTab: _numberErrTab,
                            });
                          }
                          let round_range = this.state.values["round_range"];
                          round_range[field.index]["ended_at"] = v;
                          this.setState({
                            values: { ...this.state.values, round_range },
                          });
                        }}
                        renderInput={(params) => {
                          if (params.inputProps.value == "")
                            params.error = false;
                          const keyError = _.findIndex(_errArr, {
                            key: `rounds[${field.index}].ended_at`,
                          });
                          return (
                            <TextField
                              helperText={
                                keyError >= 0 ? _errArr[keyError].msg : ""
                              }
                              className={
                                "dateTime" + (keyError >= 0 ? " tt-error" : "")
                              }
                              name={field.key}
                              disabled={_readOnly}
                              {...params}
                            />
                          );
                        }}
                        disabled={
                          _readOnly ||
                          this.state.values["round_range"]?.[field.index]?.[
                            "disabled"
                          ]
                        }
                      />
                    </div>
                    <div className="col-lg-4">
                      <label htmlFor={`round`} className="">
                        {`Ngày công bố`}
                        <span className="ms-1 color-primary">*</span>
                      </label>
                      <DateTimePicker
                        minDateTime={
                          this.state.values["round_range"]?.[field.index]?.[
                            "ended_at"
                          ]
                        }
                        value={
                          this.state.values["round_range"]?.[field.index]?.[
                            "publish_date"
                          ] || ""
                        }
                        inputFormat="dd/MM/yyyy HH:mm"
                        inputProps={{ placeholder: "dd/MM/yyyy HH:mm" }}
                        onChange={(v) => {
                          const keyError = _.findIndex(_errArr, {
                            key: `rounds[${field.index}].published_result_at`,
                          });
                          const _numberErrTab = this.state.numberErrTab;
                          if (v != "" && keyError > -1) {
                            delete _errArr[keyError];
                            _numberErrTab[field.tabKey] -= 1;
                            this.setState({
                              errors: _errArr,
                              numberErrTab: _numberErrTab,
                            });
                          }
                          let round_range =
                            this.state.values["round_range"] ?? [];
                          if (round_range?.[field.index])
                            round_range[field.index] = {
                              ...round_range[field.index],
                              publish_date: v,
                            };
                          else round_range = [{ publish_date: v }];
                          this.setState({
                            values: { ...this.state.values, round_range },
                          });
                        }}
                        disabled={
                          _readOnly ||
                          this.state.values["round_range"]?.[field.index]?.[
                            "disabled"
                          ]
                        }
                        renderInput={(params) => {
                          if (params.inputProps.value == "")
                            params.error = false;
                          const keyError = _.findIndex(_errArr, {
                            key: `rounds[${field.index}].published_result_at`,
                          });
                          return (
                            <TextField
                              helperText={
                                keyError >= 0 ? _errArr[keyError].msg : ""
                              }
                              className={
                                "dateTime" + (keyError >= 0 ? " tt-error" : "")
                              }
                              name={field.key}
                              disabled={_readOnly}
                              {...params}
                            />
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-lg-2">
                  <label htmlFor={`round`} className="">
                    {`Số lượng chọn`}
                    <span className="ms-1 color-primary">*</span>
                  </label>
                  <div>
                    <TextField
                      value={
                        this.state.values["round_range"]?.[field.index]?.[
                          "range_top"
                        ] || ""
                      }
                      type="number"
                      inputProps={{
                        max:
                          this.state.values["round_range"]?.[field.index - 1]?.[
                            "range_top"
                          ] ?? 1000,
                        min: 1,
                        inputMode: "numeric",
                        pattern: "[1-9]*",
                      }}
                      onChange={(v) => {
                        const keyError = _.findIndex(_errArr, {
                          key: `rounds[${field.index}].range_top`,
                        });
                        const _numberErrTab = this.state.numberErrTab;
                        if (v != "" && keyError > -1) {
                          delete _errArr[keyError];
                          _numberErrTab[field.tabKey] -= 1;
                          this.setState({
                            errors: _errArr,
                            numberErrTab: _numberErrTab,
                          });
                        }
                        let _value = parseInt(v.target.value);
                        if (
                          v.target.type == "number" &&
                          (v.target.max || v.target.min)
                        ) {
                          if (
                            parseInt(v.target.max) &&
                            parseInt(v.target.max) < _value
                          )
                            _value = parseInt(v.target.max);
                          if (
                            parseInt(v.target.min) &&
                            parseInt(v.target.min) > _value
                          )
                            _value = parseInt(v.target.min);
                        }
                        const round_range = this.state.values["round_range"];
                        round_range[field.index] = {
                          ...round_range[field.index],
                          range_top: _value,
                        };
                        this.setState({
                          values: { ...this.state.values, round_range },
                        });
                      }}
                      helperText={
                        errKey_rangeTop >= 0 ? _errArr[errKey_rangeTop].msg : ""
                      }
                      error={errKey_rangeTop >= 0 ? true : false}
                      InputProps={{
                        readOnly: _readOnly,
                      }}
                      disabled={
                        _readOnly ||
                        this.state.values["round_range"]?.[field.index]?.[
                          "disabled"
                        ]
                      }
                    />
                  </div>
                </div>
              </div>
            </LocalizationProvider>
          </>
        );
        break;
      case "video":
        _field = (
          <div
            className={"avatarUpload mt-2 " + (_findKey >= 0 ? "error" : "")}
          >
            <div
              className={"img " + (this.state.preview[field.key] ? "" : "show")}
            >
              <video
                src={
                  this.state.preview[field.key]
                    ? this.state.preview[field.key]
                    : "/images/transparent.png"
                }
                className="img-cover"
              />

              <label
                htmlFor={field.key}
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
            </div>
            <input
              accept="video/*"
              className="inputFile"
              name={field.key}
              id={field.key}
              type="file"
              onChange={this.handleUpload}
            />
            <p className="MuiFormHelperText-root">
              {_findKey >= 0 ? _errArr[_findKey].msg : ""}
            </p>
          </div>
        );
        break;
      case "sponsors":
        let values = this.state.values?.["sponsors"] ?? field.defaultValue;
        _field = (
          <>
            {values?.map((val, ind, arr) => {
              const anotherValues = values.filter(
                (value, index) => index != ind
              );
              const anotherSponsor = anotherValues?.reduce((prev, curr) => {
                return [...prev, ...curr.sponsor_items];
              }, []);
              _findKey = _.findIndex(_errArr, {
                key: `sponsors[${ind}].sponsor_items`,
              });
              return (
                <div className="row" key="">
                  <div className="col-lg-2 _r">
                    <label htmlFor={"sponsor_type"} className="formLabel">
                      Loại nhà tài trợ
                      <span className="ms-1 color-primary">*</span>
                    </label>
                    <div className="selectCustom">
                      <Select
                        displayEmpty
                        value={val.sponsor_type_id ?? ""}
                        onChange={(e) => {
                          e.preventDefault();
                          const _value = e.target.value;
                          const find = this.state.values.sponsors?.[ind];
                          const is_exclusive =
                            this.state.data["sponsor_types"].find(
                              (sponsor_type) => sponsor_type.id == _value
                            )?.is_exclusive ?? false;
                          if (find) {
                            find.sponsor_type_id = _value;
                            find.is_exclusive = is_exclusive;
                            if (is_exclusive) {
                              find.quantity = 1;
                              find.sponsor_type_id = _value;
                              find.sponsor_items = [];
                              this.setState({
                                values: {
                                  ...this.state.values,
                                  sponsors: [find],
                                },
                              });
                              return;
                            }
                          }
                          this.setState({
                            values: {
                              ...this.state.values,
                              sponsors: this.state.values.sponsors,
                            },
                          });
                        }}
                        // name={field.key}
                        // error={_findKey >= 0 ? true : false}
                        disabled={_readOnly}
                        className="col-lg-12 formControl"
                        // fullWidth className="selectCustom"
                      >
                        {field.values &&
                          field.values.map((v) => (
                            <MenuItem key={v.value} value={v.value}>
                              {v.label}
                            </MenuItem>
                          ))}
                        {this.state.data["sponsor_types"] &&
                          this.state.data["sponsor_types"]?.length > 0 &&
                          this.state.data["sponsor_types"]
                            ?.filter(
                              (sponsor_type) =>
                                !anotherValues.find(
                                  (another) =>
                                    another.sponsor_type_id == sponsor_type.id
                                )
                            )
                            .map((value) => (
                              <MenuItem key={value.id} value={value.id}>
                                {field?.mapField
                                  ? value[field?.mapField]
                                  : value.name
                                  ? value.name
                                  : value.title
                                  ? value.title
                                  : value.full_name}
                              </MenuItem>
                            ))}
                      </Select>
                    </div>
                  </div>
                  <div className="col-lg-1 _r formControl">
                    <label htmlFor={"sponsor_type"} className="formLabel">
                      Number
                      <span className="ms-1 color-primary">*</span>
                    </label>
                    <TextField
                      value={val?.quantity ?? ""}
                      type="number"
                      inputProps={{
                        min: 1,
                        inputMode: "numeric",
                        pattern: "[1-9]*",
                      }}
                      disabled={_readOnly || !!val.is_exclusive}
                      onChange={(e) => {
                        e.preventDefault();
                        const find = this.state.values.sponsors?.[ind];
                        if (find) find.quantity = e.target.value;
                        this.setState({
                          values: {
                            ...this.state.values,
                            sponsors: this.state.values.sponsors,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="col-lg-8 _r formControl">
                    <label htmlFor={"sponsor_type"} className="formLabel">
                      Nhà tài trợ
                      <span className="ms-1 color-primary">*</span>
                    </label>
                    <FormControl fullWidth className="selectCustom">
                      <Select
                        displayEmpty
                        multiple
                        value={val.sponsor_items ?? []}
                        onChange={(e) => {
                          e.preventDefault();
                          const _value = e.target.value;
                          const quantity =
                            this.state.values.sponsors?.[ind]?.quantity ?? 10;
                          if (_value && _value?.length > quantity) {
                            return;
                          }
                          const find = this.state.values.sponsors?.[ind];
                          if (find) find.sponsor_items = _value;
                          this.setState({
                            values: {
                              ...this.state.values,
                              sponsors: this.state.values.sponsors,
                            },
                          });
                        }}
                        // name={field.key}
                        error={_findKey >= 0 ? true : false}
                        disabled={_readOnly}
                        renderValue={(selected) => {
                          if (selected.length > 0) {
                            const _name = selected.map((id) => {
                              const find = this.state.data[
                                "sponsor_items"
                              ]?.find((item) => item.id == id);
                              if (find?.name) return find.name;
                              return id;
                            });
                            return _name.join(",");
                          }
                        }}
                        className="col-lg-12 formControl"
                      >
                        {this.state.data["sponsor_items"] &&
                          this.state.data["sponsor_items"]?.length > 0 &&
                          this.state.data["sponsor_items"]
                            .filter(
                              (sponsor) => !anotherSponsor.includes(sponsor.id)
                            )
                            .map((value) => (
                              <MenuItem key={value.id} value={value.id}>
                                {field?.mapField
                                  ? value[field?.mapField]
                                  : value.name
                                  ? value.name
                                  : value.title
                                  ? value.title
                                  : value.full_name}
                              </MenuItem>
                            ))}
                      </Select>
                      <FormHelperText>
                        {_findKey >= 0 ? _errArr[_findKey].msg : ""}
                      </FormHelperText>
                    </FormControl>
                  </div>
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      if (_readOnly) return;
                      const sponsors = this.state.values.sponsors.filter(
                        (val, index) => ind != index
                      );
                      if (sponsors.length > 0)
                        this.setState({
                          values: { ...this.state.values, sponsors },
                        });
                    }}
                    className="col-lg-1 _r formControl"
                    style={{ margin: "auto", cursor: "pointer" }}
                  >
                    <i className="far fa-trash-alt"></i>
                  </div>
                  {ind == arr.length - 1 && (
                    <div className="col-lg-1 _r formControl">
                      <Button
                        className="tt-btn btn btn-primary"
                        style={{ width: "100%" }}
                        disabled={_readOnly || !!val.is_exclusive}
                        onClick={(e) => {
                          e.preventDefault();
                          const sponsors = this.state.values.sponsors;
                          sponsors.push({
                            sponsor_type_id: "",
                            quanity: undefined,
                            sponsor_items: [],
                          });
                          this.setState({
                            values: { ...this.state.values, sponsors },
                          });
                        }}
                      >
                        <i className="fa fa-plus margin-none"></i>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        );
        break;
      case "number":
        _field = (
          <TextField
            name={field.key}
            type="number"
            value={this.state.values?.[field.key] ?? 0}
            onChange={this.handleChangeValue}
            helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
            error={_findKey >= 0 ? true : false}
            inputProps={{
              min: field?.min ?? 0,
              inputMode: "numeric",
              pattern: "[1-9]*",
            }}
            disabled={_readOnly || false}
          />
        );
        break;
      case "label_text":
        let label_val = this.state.values;
        let label_parse = field.key.split(".");
        if (label_parse.length == 2)
          label_val =
            label_val[label_parse[0]] &&
            label_val[label_parse[0]][label_parse[1]]
              ? label_val[label_parse[0]][label_parse[1]]
              : "";
        else label_val = label_val[field.key];
        _field = (
          <TextField
            rows={field?.row ?? 8}
            className="p-0"
            name={field.key}
            value={label_val || (field?.defaultValue ?? "")}
            onChange={this.handleChangeValue}
            focused={false}
            InputProps={{
              readOnly: true,
            }}
          />
        );
        break;
      case "label_dateTimeDMY":
        _field = (
          <TextField
            rows={field?.row ?? 8}
            className="p-0"
            name={field.key}
            value={
              moment(this.state.values?.[field.key]).format("DD/MM/YYYY") ||
              (field?.defaultValue ?? "")
            }
            onChange={this.handleChangeValue}
            focused={false}
            InputProps={{
              readOnly: true,
            }}
          />
        );
        break;
      case "canvas":
        _field = (
          <div
            className="canvas-wrapper"
            id="canvas-wrapper"
            style={{
              background: "gray",
              minHeight: "500px",
              width: "100%",
              height: "100%",
            }}
          >
            <canvas
              // className={styles.canvasdialog}
              id="canvasdialog"
              style={{ width: "100%", aspectRatio: "1/1" }}
            />
          </div>
        );
        break;
      case "addMoreList":
        values = this.state.values?.[field.key] ?? [];
        _field = (
          <>
            {values.length > 0 &&
              values.map((value, ind) => {
                return field?.elements?.length > 0 ? (
                  <div className="row" key={`addMoreList-$${ind}`}>
                    {field?.elements.map((element, i) => {
                      const [, key_element] = element.key.split("_");
                      return (
                        <div
                          className={`col-lg-${i == 0 ? 3 : 2} formControl`}
                          style={{ marginBottom: 20 }}
                          key={`form-addMoreList-$${ind}-${i}`}
                        >
                          <FormControl
                            fullWidth
                            className="selectCustom"
                            key={`addMoreList-label-$${ind}-${i}`}
                          >
                            <label className="formLabel">
                              {element.label}
                              <span className="ms-1 color-primary">*</span>
                            </label>
                            {element.key == "field_type" ? (
                              <>
                                <Select
                                  value={value?.[key_element] ?? ""}
                                  error={
                                    !!_errArr?.find(
                                      (err) =>
                                        err.key ==
                                        `${field.key}[${ind}].${key_element}`
                                    )?.msg
                                  }
                                  onChange={(e) => {
                                    const _indexErr = _.findIndex(_errArr, {
                                      key: `${field.key}[${ind}].${key_element}`,
                                    });
                                    if (_indexErr > -1) {
                                      _errArr = _errArr.filter(
                                        (_, i) => i != _indexErr
                                      );
                                    }
                                    value[key_element] = e.target.value;
                                    this.setState({
                                      ...this.state,
                                      errors: _errArr,
                                      values: {
                                        ...this.state.values,
                                        [field.key]: values,
                                      },
                                    });
                                  }}
                                >
                                  {(element?.data && element.data.length > 0
                                    ? element.data
                                    : fieldAddmore
                                  ).map((v) => (
                                    <MenuItem key={v.value} value={v.value}>
                                      {v.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </>
                            ) : (
                              <>
                                <TextField
                                  value={value?.[key_element] ?? ""}
                                  helperText={
                                    _errArr?.find(
                                      (err) =>
                                        err.key ==
                                        `${field.key}[${ind}].${key_element}`
                                    )?.msg ?? ""
                                  }
                                  error={
                                    !!_errArr?.find(
                                      (err) =>
                                        err.key ==
                                        `${field.key}[${ind}].${key_element}`
                                    )?.msg
                                  }
                                  onChange={(e) => {
                                    const _indexErr = _.findIndex(_errArr, {
                                      key: `${field.key}[${ind}].${key_element}`,
                                    });
                                    if (_indexErr > -1) {
                                      _errArr = _errArr.filter(
                                        (_, i) => i != _indexErr
                                      );
                                    }
                                    value[key_element] = e.target.value;
                                    this.setState({
                                      ...this.state,
                                      errors: _errArr,
                                      values: {
                                        ...this.state.values,
                                        [field.key]: values,
                                      },
                                    });
                                  }}
                                />
                              </>
                            )}
                          </FormControl>
                        </div>
                      );
                    })}
                    <div
                      className="col-lg-1 formControl"
                      style={{ margin: "auto 0" }}
                      key={`addMoreList-btn-$${ind}`}
                    >
                      <div
                        style={{ width: "100%" }}
                        onClick={(e) => {
                          if (_errArr.length > 0) {
                            _errArr = _errArr.filter(
                              (err) =>
                                err["key"].indexOf(`${field.key}[${ind}]`) == -1
                            );
                          }
                          const res = values.filter((_, i) => i != ind);
                          this.setState({
                            ...this.state,
                            errors: _errArr,
                            values: { ...this.state.values, [field.key]: res },
                          });
                        }}
                      >
                        <i className="far fa-trash-alt"></i>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="row" key={`addMoreList-$${ind}`}>
                    <div
                      className="col-lg-4 formControl"
                      style={{ marginBottom: 20 }}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        key={`addMoreList-label-$${ind}`}
                      >
                        <label className="formLabel">
                          Tên
                          <span className="ms-1 color-primary">*</span>
                        </label>
                        <TextField
                          value={value.label ?? ""}
                          helperText={
                            _errArr?.find(
                              (err) => err.key == `${field.key}[${ind}].label`
                            )?.msg ?? ""
                          }
                          error={
                            !!_errArr?.find(
                              (err) => err.key == `${field.key}[${ind}].label`
                            )?.msg
                          }
                          onChange={(e) => {
                            const _indexErr = _.findIndex(_errArr, {
                              key: `${field.key}[${ind}].label`,
                            });
                            if (_indexErr > -1) {
                              _errArr = _errArr.filter(
                                (_, i) => i != _indexErr
                              );
                            }
                            value["label"] = e.target.value;
                            this.setState({
                              ...this.state,
                              errors: _errArr,
                              values: {
                                ...this.state.values,
                                [field.key]: values,
                              },
                            });
                          }}
                        />
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-3 formControl"
                      style={{ marginBottom: 20 }}
                    >
                      <FormControl fullWidth key={`addMoreList-key-$${ind}`}>
                        <label className="formLabel">
                          Key
                          <span className="ms-1 color-primary">*</span>
                        </label>
                        <TextField value={value.key ?? ""} disabled />
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-2 formControl"
                      key={`addMoreList-type-$${ind}`}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                      >
                        <label className="formLabel">
                          Loại giá trị
                          <span className="ms-1 color-primary">*</span>
                        </label>
                        <Select
                          value={value.type ?? ""}
                          error={
                            !!_errArr?.find(
                              (err) => err.key == `${field.key}[${ind}].type`
                            )?.msg
                          }
                          onChange={(e) => {
                            const _indexErr = _.findIndex(_errArr, {
                              key: `${field.key}[${ind}].type`,
                            });
                            if (_indexErr > -1) {
                              _errArr = _errArr.filter(
                                (_, i) => i != _indexErr
                              );
                            }
                            value["type"] = e.target.value;
                            this.setState({
                              ...this.state,
                              errors: _errArr,
                              values: {
                                ...this.state.values,
                                [field.key]: values,
                              },
                            });
                          }}
                        >
                          {fieldAddmore.map((v) => (
                            <MenuItem key={v.value} value={v.value}>
                              {v.label}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {_errArr?.find(
                            (err) => err.key == `${field.key}[${ind}].type`
                          )?.msg ?? ""}
                        </FormHelperText>
                        {value.type == "select" && (
                          <Box sx={{ flexGrow: 1 }}>
                            <TextField
                              multiline
                              maxRows={this.state?.[value.key]?.length ?? 4}
                              style={{ width: "200px" }}
                              onKeyDown={(e) => {
                                if (e.key === "Tab") {
                                  this.setState({
                                    [value.key]: [
                                      ...(this.state?.[value.key] ?? []),
                                      this.tagRef.current.value,
                                    ],
                                    values: {
                                      ...this.state.values,
                                      [field.key]: values,
                                    },
                                  });
                                  if (
                                    _errArr?.[_findKey]?.errors?.[
                                      `${field.targetField}field_label`
                                    ]
                                  ) {
                                    delete _errArr[_findKey]["errors"][
                                      `${field.targetField}field_label`
                                    ];
                                  }
                                  if (
                                    _errArr?.[_findKey]?.errors?.[
                                      `${field.targetField}field_key`
                                    ]
                                  ) {
                                    delete _errArr[_findKey]["errors"][
                                      `${field.targetField}field_key`
                                    ];
                                  }
                                  value["option"] = [
                                    ...(this.state?.[value.key] ?? []),
                                    this.tagRef.current.value,
                                  ];
                                  this.setState({
                                    values: {
                                      ...this.state.values,
                                      [field.key]: values,
                                    },
                                  });
                                  this.tagRef.current.value = "";
                                }
                              }}
                              inputRef={this.tagRef}
                              fullWidth
                              variant="standard"
                              size="small"
                              sx={{ margin: "1rem 0" }}
                              margin="none"
                              placeholder="Enter tags here"
                              InputProps={{
                                startAdornment: (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: "4px",
                                      width: 570,
                                    }}
                                  >
                                    {this.state?.[value.key]?.map(
                                      (val, key) => (
                                        <Box
                                          key={key}
                                          sx={{
                                            background: "#283240",
                                            height: "100%",
                                            display: "flex",
                                            padding: "0.4rem",
                                            margin: "0 0.5rem 0 0",
                                            justifyContent: "center",
                                            alignContent: "center",
                                            color: "#ffffff",
                                          }}
                                        >
                                          <Stack direction="row" gap={1}>
                                            <Typography>{val}</Typography>
                                          </Stack>
                                          <CancelIcon
                                            onClick={() => {
                                              this.handleDeleteTag(val, value);
                                            }}
                                            sx={{ cursor: "pointer" }}
                                          />
                                        </Box>
                                      )
                                    )}
                                  </Box>
                                ),
                              }}
                            />
                          </Box>
                        )}
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-1 formControl"
                      key={`addMoreList-required-$${ind}`}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                      >
                        <label className="formLabel">Required</label>
                        <Select
                          value={value.required ?? ""}
                          error={
                            !!_errArr?.find(
                              (err) =>
                                err.key == `${field.key}[${ind}].required`
                            )?.msg
                          }
                          onChange={(e) => {
                            const _indexErr = _.findIndex(_errArr, {
                              key: `${field.key}[${ind}].required`,
                            });
                            if (_indexErr > -1) {
                              _errArr = _errArr.filter(
                                (_, i) => i != _indexErr
                              );
                            }
                            value["required"] = e.target.value;
                            this.setState({
                              ...this.state,
                              errors: _errArr,
                              values: {
                                ...this.state.values,
                                [field.key]: values,
                              },
                            });
                          }}
                        >
                          {[
                            { value: "0", label: "No" },
                            { value: "1", label: "Yes" },
                          ].map((v) => (
                            <MenuItem key={v.value} value={v.value}>
                              {v.label}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {_errArr?.find(
                            (err) => err.key == `${field.key}[${ind}].required`
                          )?.msg ?? ""}
                        </FormHelperText>
                      </FormControl>
                    </div>
                    <div className="col-lg-1 formControl">
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                        key={`addMoreList-sort-$${ind}`}
                      >
                        <label className="formLabel">Vị trí</label>
                        <TextField
                          value={value.sort ?? ""}
                          onChange={(e) => {
                            const _indexErr = _.findIndex(_errArr, {
                              key: `${field.key}[${ind}].sort`,
                            });
                            if (_indexErr > -1) {
                              _errArr = _errArr.filter(
                                (_, i) => i != _indexErr
                              );
                            }
                            value["sort"] = e.target.value;
                            this.setState({
                              ...this.state,
                              errors: _errArr,
                              values: {
                                ...this.state.values,
                                [field.key]: values,
                              },
                            });
                          }}
                          type="number"
                          inputProps={{
                            inputMode: "numeric",
                            pattern: "[1-9]*",
                          }}
                        />
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-1 formControl"
                      style={{ margin: "auto" }}
                      key={`addMoreList-btn-$${ind}`}
                    >
                      <div
                        style={{ width: "100%" }}
                        onClick={(e) => {
                          if (_errArr.length > 0) {
                            _errArr = _errArr.filter(
                              (err) =>
                                err["key"].indexOf(`${field.key}[${ind}]`) == -1
                            );
                          }
                          const res = values.filter((_, i) => i != ind);
                          this.setState({
                            ...this.state,
                            errors: _errArr,
                            values: { ...this.state.values, [field.key]: res },
                          });
                        }}
                      >
                        <i className="far fa-trash-alt"></i>
                      </div>
                    </div>
                  </div>
                );
              })}
          </>
        );
        break;
      case "addMore":
        values = this.state.values?.[field.targetField] ?? [];
        _field = (
          <>
            <div className="row _r">
              {field?.elements?.length > 0 ? (
                <>
                  {field.elements.map((element, ind) => (
                    <div
                      className={`col-lg-${ind == 0 ? 3 : 2} formControl`}
                      style={{ marginBottom: 20 }}
                      key={`addMore-${element.label}`}
                    >
                      <FormControl fullWidth className="selectCustom">
                        <label htmlFor={"field_label"} className="formLabel">
                          {element.label}
                          <span className="ms-1 color-primary">*</span>
                        </label>
                        {element.key == "field_type" ? (
                          <>
                            <Select
                              value={this.state?.[element.key] ?? ""}
                              onChange={(e) => {
                                if (
                                  _errArr?.[_findKey]?.errors?.[element.key]
                                ) {
                                  delete _errArr[_findKey]["errors"][
                                    element.key
                                  ];
                                }
                                this.setState({
                                  [element.key]: e.target.value,
                                  errors: _errArr,
                                });
                              }}
                              name={element.key}
                              error={
                                !!_errArr?.[_findKey]?.errors?.[element.key]
                              }
                            >
                              {(element?.data && element.data.length > 0
                                ? element.data
                                : fieldAddmore
                              ).map((v) => (
                                <MenuItem key={v.value} value={v.value}>
                                  {v.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </>
                        ) : (
                          <>
                            <TextField
                              name={element.key}
                              value={this.state?.[element.key] ?? ""}
                              error={
                                !!_errArr?.[_findKey]?.errors?.[element.key]
                              }
                              helperText={
                                _errArr?.[_findKey]?.errors?.[element.key] ?? ""
                              }
                              onChange={(e) => {
                                if (
                                  _errArr?.[_findKey]?.errors?.[element.key]
                                ) {
                                  delete _errArr[_findKey]["errors"][
                                    element.key
                                  ];
                                }
                                this.setState({
                                  [element.key]: e.target.value,
                                });
                              }}
                            />
                          </>
                        )}
                        <FormHelperText>
                          {_errArr?.[_findKey]?.errors?.[element.key] ?? ""}
                        </FormHelperText>
                      </FormControl>
                    </div>
                  ))}
                  <div className="col-lg-1 formControl" key={`addMore-btn`}>
                    <Button
                      className="tt-btn btn btn-primary margin-right-none"
                      style={{ width: "100%", marginTop: 17 }}
                      disabled={_errArr?.some(
                        (err) =>
                          err.key == field.key &&
                          err?.errors &&
                          Object.keys(err.errors).length > 0
                      )}
                      onClick={(e) => {
                        const _errors = {};
                        const _obj = {};

                        field?.elements.forEach((item) => {
                          const key = item.key.toLowerCase();
                          if (!this.state[key]) {
                            _errors[key] = `${
                              item.key.split("_")[1]
                            } là bắt buộc`;
                          } else if (
                            key == "field_key" &&
                            values?.some(
                              (value) => value?.["key"] == this.state[key]
                            )
                          ) {
                            _errors[key] = `${
                              item.key.split("_")[1]
                            } đã tồn tại`;
                          } else {
                            _obj[item.key.split("_")[1]] = this.state[key];
                          }
                        });
                        if (Object.keys(_errors).length > 0) {
                          if (typeof _findKey == "undefined") {
                            _errArr.push({ key: field.key, errors: _errors });
                          } else _errArr[_findKey].errors = _errors;
                          this.setState({ ...this.state, errors: _errArr });
                          return;
                        }
                        values.push({
                          ..._obj,
                          col: "left",
                        });
                        field?.elements.forEach((item) => {
                          const key = item.key.toLowerCase();
                          delete this.state[key];
                        });
                        this.setState({
                          ...this.state,
                          values: {
                            ...this.state.values,
                            [field.targetField]: values,
                          },
                        });
                      }}
                    >
                      <i className="fa fa-plus margin-right-none"></i>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="col-lg-7 formControl"
                    style={{ marginBottom: 20 }}
                    key={`addMore-label`}
                  >
                    <FormControl fullWidth className="selectCustom">
                      <label htmlFor={"field_label"} className="formLabel">
                        Tên
                        <span className="ms-1 color-primary">*</span>
                      </label>
                      <TextField
                        name={`${field.targetField}field_label`}
                        value={
                          this.state?.[`${field.targetField}field_label`] ?? ""
                        }
                        error={
                          !!_errArr?.[_findKey]?.errors?.[
                            `${field.targetField}field_label`
                          ]
                        }
                        helperText={
                          _errArr?.[_findKey]?.errors?.[
                            `${field.targetField}field_label`
                          ] ?? ""
                        }
                        onChange={(e) => {
                          if (
                            _errArr?.[_findKey]?.errors?.[
                              `${field.targetField}field_label`
                            ]
                          ) {
                            delete _errArr[_findKey]["errors"][
                              `${field.targetField}field_label`
                            ];
                          }
                          if (
                            _errArr?.[_findKey]?.errors?.[
                              `${field.targetField}field_key`
                            ]
                          ) {
                            delete _errArr[_findKey]["errors"][
                              `${field.targetField}field_key`
                            ];
                          }
                          const field_key =
                            changeToSlug(e.target.value)?.replaceAll("-", "_") +
                            random(1000, 9999);
                          this.setState({
                            [`${field.targetField}field_label`]: e.target.value,
                            errors: _errArr,
                          });
                          this.setState({
                            [`${field.targetField}field_key`]: field_key,
                            errors: _errArr,
                          });
                        }}
                      />
                      <FormHelperText>
                        {_errArr?.[_findKey]?.errors?.[
                          `${field.targetField}field_label`
                        ] ?? ""}
                      </FormHelperText>
                    </FormControl>
                  </div>
                  <div className="col-lg-2 formControl" key={`addMore-type`}>
                    <FormControl
                      fullWidth
                      className="selectCustom"
                      style={{ marginBottom: 20 }}
                    >
                      <label
                        htmlFor={`${field.targetField}field_type`}
                        className="formLabel"
                      >
                        Loại giá trị
                        <span className="ms-1 color-primary">*</span>
                      </label>
                      <Select
                        value={
                          this.state?.[`${field.targetField}field_type`] ?? ""
                        }
                        onChange={(e) => {
                          if (
                            _errArr?.[_findKey]?.errors?.[
                              `${field.targetField}field_type`
                            ]
                          ) {
                            delete _errArr[_findKey]["errors"][
                              `${field.targetField}field_type`
                            ];
                          }
                          this.setState({
                            [`${field.targetField}field_type`]: e.target.value,
                            errors: _errArr,
                          });
                        }}
                        name={`${field.targetField}field_type`}
                        error={
                          !!_errArr?.[_findKey]?.errors?.[
                            `${field.targetField}field_type`
                          ]
                        }
                      >
                        {fieldAddmore.map((v) => (
                          <MenuItem key={v.value} value={v.value}>
                            {v.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {_errArr?.[_findKey]?.errors?.[
                          `${field.targetField}field_type`
                        ] ?? ""}
                      </FormHelperText>
                    </FormControl>
                  </div>
                  <div
                    className="col-lg-1 formControl"
                    key={`addMore-required`}
                  >
                    <FormControl
                      fullWidth
                      className="selectCustom"
                      style={{ marginBottom: 20 }}
                    >
                      <label
                        htmlFor={`${field.targetField}field_required`}
                        className="formLabel"
                      >
                        Required
                      </label>
                      <Select
                        value={
                          this.state?.[`${field.targetField}field_required`] ??
                          ""
                        }
                        onChange={(e) => {
                          if (
                            _errArr?.[_findKey]?.errors?.[
                              `${field.targetField}field_required`
                            ]
                          ) {
                            delete _errArr[_findKey]["errors"][
                              `${field.targetField}field_required`
                            ];
                          }
                          this.setState({
                            [`${field.targetField}field_required`]:
                              e.target.value,
                            errors: _errArr,
                          });
                        }}
                        name={`${field.targetField}field_required`}
                        error={
                          !!_errArr?.[_findKey]?.errors?.[
                            `${field.targetField}field_required`
                          ]
                        }
                      >
                        {[
                          { value: "0", label: "No" },
                          { value: "0", label: "Yes" },
                        ].map((v) => (
                          <MenuItem key={v.value} value={v.value}>
                            {v.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {_errArr?.[_findKey]?.errors?.["field_required"] ?? ""}
                      </FormHelperText>
                    </FormControl>
                  </div>
                  <div className="col-lg-1 formControl" key={`addMore-sort`}>
                    <FormControl
                      fullWidth
                      className="selectCustom"
                      style={{ marginBottom: 20 }}
                    >
                      <label htmlFor={"field_sort"} className="formLabel">
                        Vị trí
                      </label>
                      <TextField
                        name={`${field.targetField}field_sort`}
                        value={
                          this.state?.[`${field.targetField}field_sort`] ?? ""
                        }
                        onChange={(e) => {
                          if (
                            _errArr?.[_findKey]?.errors?.[
                              `${field.targetField}field_sort`
                            ]
                          ) {
                            delete _errArr[_findKey]["errors"][
                              `${field.targetField}field_sort`
                            ];
                          }
                          this.setState({
                            [`${field.targetField}field_sort`]: e.target.value,
                          });
                        }}
                        type="number"
                        inputProps={{
                          inputMode: "numeric",
                          pattern: "[1-9]*",
                        }}
                      />
                      <FormHelperText>
                        {_errArr?.[_findKey]?.errors?.[
                          `${field.targetField}field_sort`
                        ] ?? ""}
                      </FormHelperText>
                    </FormControl>
                  </div>
                  <div className="col-lg-1 formControl" key={`addMore-btn`}>
                    <Button
                      className="tt-btn btn btn-primary margin-right-none"
                      style={{ width: "100%", marginTop: 17 }}
                      disabled={_errArr?.some(
                        (err) =>
                          err.key == field.key &&
                          err?.errors &&
                          Object.keys(err.errors).length > 0
                      )}
                      onClick={(e) => {
                        const _errors = {};
                        ["field_Key", "field_Label", "field_Type"].forEach(
                          (item) => {
                            const key = field.targetField + item.toLowerCase();
                            if (!this.state[key]) {
                              _errors[key] = `${
                                item.split("_")[1]
                              } là bắt buộc`;
                            } else if (
                              key == "field_key" &&
                              values?.some(
                                (value) => value?.["key"] == this.state[key]
                              )
                            ) {
                              _errors[key] = `${item.split("_")[1]} đã tồn tại`;
                            }
                          }
                        );
                        if (Object.keys(_errors).length > 0) {
                          if (typeof _findKey == "undefined") {
                            _errArr.push({ key: field.key, errors: _errors });
                          } else _errArr[_findKey].errors = _errors;
                          this.setState({ ...this.state, errors: _errArr });
                          return;
                        }

                        values.push({
                          key: this.state?.[`${field.targetField}field_key`],
                          label:
                            this.state?.[`${field.targetField}field_label`],
                          type: this.state?.[`${field.targetField}field_type`],
                          option:
                            this.state?.[`${field.targetField}field_option`],
                          required:
                            this.state?.[`${field.targetField}field_required`],
                          sort: this.state?.[`${field.targetField}field_sort`],
                          col: "left",
                        });

                        delete this.state?.[`${field.targetField}field_key`];
                        delete this.state?.[`${field.targetField}field_label`];
                        delete this.state?.[`${field.targetField}field_type`];
                        delete this.state?.[
                          `${field.targetField}field_required`
                        ];
                        delete this.state?.[`${field.targetField}field_sort`];

                        this.setState({
                          values: {
                            ...this.state.values,
                            [field.targetField]: values,
                          },
                        });
                      }}
                    >
                      <i className="fa fa-plus margin-right-none"></i>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        );
        break;
      case "color":
        if (_parse.length == 2)
          _val =
            _val[_parse[0]] && _val[_parse[0]][_parse[1]]
              ? _val[_parse[0]][_parse[1]]
              : "";
        else _val = _val[field.key];
        _options = new Set(
          [
            "linear-gradient(180deg, #0066FF 0%, #00FFD1 100%)",
            "linear-gradient(180deg, #0032FF 24.66%, #28EFE3 125%)",
            "linear-gradient(180deg, #F40202 24.66%, #200205 125%)",
            "linear-gradient(90deg, #D66802 0%, #A97B23 32.85%, #FEE677 65.6%, #E18A2D 100%)",
            "linear-gradient(180deg, #F4B840 0.33%, #972121 79.66%)",
            "linear-gradient(180deg, #FF0E90 0.33%, #6F0437 79.66%)",
            "linear-gradient(261.21deg, #0EFF17 4.91%, #FF0000 32.96%, #0047FF 93.2%)",
            ...(this.state.data[field.key.split(".")[0]] ?? []),
          ] ?? []
        );
        _options = [..._options];
        _field = (
          <div className="row _r">
            <div className="col-lg-10">
              <Autocomplete
                multiple={false}
                size="small"
                options={_options}
                filterOptions={(options, params) => {
                  const { inputValue } = params;
                  if (inputValue == "") {
                    return options;
                  }
                  const filtered = _.filter(
                    options,
                    (item) => item.toLowerCase().indexOf(inputValue) > -1
                  );
                  // Suggest the creation of a new value
                  const isExisting = options.some(
                    (option) => inputValue === option
                  );
                  if (inputValue !== "" && !isExisting) {
                    filtered.push(`Add ${inputValue}`);
                  }
                  return filtered;
                }}
                onChange={(e, v) => {
                  let data = this.state.data;
                  let _value = v;
                  if (v?.startsWith("Add")) {
                    _value = v.replace(/Add/g, "").trim();
                    data[field.key.split(".")[0]] =
                      data?.[field.key.split(".")[0]] || [];
                    data[field.key.split(".")[0]].push(_value);
                  }
                  if (field.key.split(".")?.length > 1) {
                    const values = this.state.values;
                    let _key = "";
                    const _val = values[field.key.split(".")[0]] || {};
                    field.key.split(".").forEach((key, ind, arr) => {
                      if (ind == 0) {
                        _key = key;
                      } else if (ind == arr.length - 1)
                        _val[key] = _value ?? "";
                      else _val[key] = _val[key] ?? {};
                    });
                    values[_key] = _val;
                    this.setState({ values, data });
                  } else
                    this.setState({
                      values: {
                        ...this.state.values,
                        [field.key]: _value ?? "",
                      },
                      data,
                    });
                }}
                value={_val || ""}
                renderInput={(params) => (
                  <TextField {...params} name={field.key} />
                )}
              />
              {/* <TextField
                  className="p-0"
                  name={field.key}
                  value={_val || ""}
                  onChange={this.handleChangeValue}
                  focused={false}
                /> */}
            </div>
            <div className="col-lg-2" style={{ background: _val || "gray" }} />
          </div>
        );
        break;
      case "background_color":
        if (_parse.length == 2)
          _val =
            _val[_parse[0]] && _val[_parse[0]][_parse[1]]
              ? _val[_parse[0]][_parse[1]]
              : "";
        else _val = _val[field.key];
        _options = new Set(
          [
            "linear-gradient(180deg, #0066FF 0%, #00FFD1 100%)",
            "linear-gradient(180deg, #0032FF 24.66%, #28EFE3 125%)",
            "linear-gradient(180deg, #F40202 24.66%, #200205 125%)",
            "linear-gradient(90deg, #D66802 0%, #A97B23 32.85%, #FEE677 65.6%, #E18A2D 100%)",
            "linear-gradient(180deg, #F4B840 0.33%, #972121 79.66%)",
            "linear-gradient(180deg, #FF0E90 0.33%, #6F0437 79.66%)",
            "linear-gradient(261.21deg, #0EFF17 4.91%, #FF0000 32.96%, #0047FF 93.2%)",
            ...(this.state.data[field.key.split(".")[0]] ?? []),
          ] ?? []
        );
        _options = [..._options];
        _field = (
          <div className="row _r">
            <div className="col-lg-10">
              <Autocomplete
                multiple={false}
                size="small"
                options={_options}
                filterOptions={(options, params) => {
                  const { inputValue } = params;
                  if (inputValue == "") {
                    return options;
                  }
                  const filtered = _.filter(
                    options,
                    (item) => item.toLowerCase().indexOf(inputValue) > -1
                  );
                  // Suggest the creation of a new value
                  const isExisting = options.some(
                    (option) => inputValue === option
                  );
                  if (inputValue !== "" && !isExisting) {
                    filtered.push(`Add ${inputValue}`);
                  }
                  return filtered;
                }}
                onChange={(e, v) => {
                  let data = this.state.data;
                  let _value = v;
                  if (v?.startsWith("Add")) {
                    _value = v.replace(/Add/g, "").trim();
                    data[field.key.split(".")[0]] =
                      data?.[field.key.split(".")[0]] || [];
                    data[field.key.split(".")[0]].push(_value);
                  }
                  if (field.key.split(".")?.length > 1) {
                    const values = this.state.values;
                    let _key = "";
                    const _val = values[field.key.split(".")[0]] || {};
                    field.key.split(".").forEach((key, ind, arr) => {
                      if (ind == 0) {
                        _key = key;
                      } else if (ind == arr.length - 1)
                        _val[key] = _value ?? "";
                      else _val[key] = _val[key] ?? {};
                    });
                    values[_key] = _val;
                    this.setState({ values, data });
                  } else
                    this.setState({
                      values: {
                        ...this.state.values,
                        [field.key]: _value ?? "",
                      },
                      data,
                    });
                }}
                value={_val || ""}
                renderInput={(params) => (
                  <TextField {...params} name={field.key} />
                )}
              />
              {/* <TextField
                    className="p-0"
                    name={field.key}
                    value={_val || ""}
                    onChange={this.handleChangeValue}
                    focused={false}
                  /> */}
            </div>
            <div className="col-lg-2" style={{ background: _val || "gray" }} />
          </div>
        );
        break;
      case "button_color":
        if (_parse.length == 2)
          _val =
            _val[_parse[0]] && _val[_parse[0]][_parse[1]]
              ? _val[_parse[0]][_parse[1]]
              : "";
        else _val = _val[field.key];
        _options = new Set(
          [
            "linear-gradient(180deg, #0066FF 0%, #00FFD1 100%)",
            "linear-gradient(180deg, #0032FF 24.66%, #28EFE3 125%)",
            "linear-gradient(180deg, #F40202 24.66%, #200205 125%)",
            "linear-gradient(90deg, #D66802 0%, #A97B23 32.85%, #FEE677 65.6%, #E18A2D 100%)",
            "linear-gradient(180deg, #F4B840 0.33%, #972121 79.66%)",
            "linear-gradient(180deg, #FF0E90 0.33%, #6F0437 79.66%)",
            "linear-gradient(261.21deg, #0EFF17 4.91%, #FF0000 32.96%, #0047FF 93.2%)",
            ...(this.state.data[field.key.split(".")[0]] ?? []),
          ] ?? []
        );
        _options = [..._options];
        _field = (
          <div className="row _r">
            <div className="col-lg-10">
              <Autocomplete
                multiple={false}
                size="small"
                options={_options}
                filterOptions={(options, params) => {
                  const { inputValue } = params;
                  if (inputValue == "") {
                    return options;
                  }
                  const filtered = _.filter(
                    options,
                    (item) => item.toLowerCase().indexOf(inputValue) > -1
                  );
                  // Suggest the creation of a new value
                  const isExisting = options.some(
                    (option) => inputValue === option
                  );
                  if (inputValue !== "" && !isExisting) {
                    filtered.push(`Add ${inputValue}`);
                  }
                  return filtered;
                }}
                onChange={(e, v) => {
                  let data = this.state.data;
                  let _value = v;
                  if (v?.startsWith("Add")) {
                    _value = v.replace(/Add/g, "").trim();
                    data[field.key.split(".")[0]] =
                      data?.[field.key.split(".")[0]] || [];
                    data[field.key.split(".")[0]].push(_value);
                  }
                  if (field.key.split(".")?.length > 1) {
                    const values = this.state.values;
                    let _key = "";
                    const _val = values[field.key.split(".")[0]] || {};
                    field.key.split(".").forEach((key, ind, arr) => {
                      if (ind == 0) {
                        _key = key;
                      } else if (ind == arr.length - 1)
                        _val[key] = _value ?? "";
                      else _val[key] = _val[key] ?? {};
                    });
                    values[_key] = _val;
                    this.setState({ values, data });
                  } else
                    this.setState({
                      values: {
                        ...this.state.values,
                        [field.key]: _value ?? "",
                      },
                      data,
                    });
                }}
                value={_val || ""}
                renderInput={(params) => (
                  <TextField {...params} name={field.key} />
                )}
              />
              {/* <TextField
                    className="p-0"
                    name={field.key}
                    value={_val || ""}
                    onChange={this.handleChangeValue}
                    focused={false}
                  /> */}
            </div>
            <div className="col-lg-2" style={{ background: _val || "gray" }} />
          </div>
        );
        break;
      case "timelinelog":
        _field = (
          <div
            key={"timelinelog"}
            style={{ height: "400px" }}
            className="timeline"
          >
            <PerfectScrollbar>
              {this.state.data[field?.key]
                ? (this.state.data[field?.key] ?? []).map((value) => {
                    try {
                      value.detail = value.detail
                        ? JSON.parse(value.detail)
                        : "";
                    } catch (error) {
                      value.detail = "";
                    }
                    return (
                      <div key={value?.id} className="timelineOnce">
                        <div className="timelineItem">
                          <div className="fw-bolder text-gray-800 timelineLabel">
                            {value?.created_at &&
                              moment(value.created_at).format(
                                "HH:mm - DD/MM/YYYY"
                              )}
                          </div>
                          <div className="timelineBadge">
                            <i className="fa fa-genderless text-info"></i>
                          </div>
                          {
                            <div className="fw-mormal text-muted ps-3 timelineContent">
                              <h4
                                className={
                                  typeof value.is_current !== "undefined" &&
                                  value.is_current == true
                                    ? "current"
                                    : ""
                                }
                              >
                                {value?.email ?? "Unknown"} -{" "}
                                {` ${value?.type ?? "Unknown"}`}
                              </h4>
                              {value.detail != "" &&
                                Object.keys(value.detail).length > 0 &&
                                Object.entries(value.detail).map(([k, v]) => (
                                  <p key={k}>{`${k} : ${v.old} -> ${v.upt}`}</p>
                                ))}
                            </div>
                          }
                        </div>
                      </div>
                    );
                  })
                : ""}
            </PerfectScrollbar>
          </div>
        );
        break;
      case "file":
        _field = (
          <Link href={(field?.cdn ?? process.env.CDN_URL_S3) + _val[field.key]}>
            Link
          </Link>
        );
        break;
      default:
        _val = this.state.values;
        _parse = field.key.split(".");
        if (_parse.length == 2)
          _val =
            _val[_parse[0]] && _val[_parse[0]][_parse[1]]
              ? _val[_parse[0]][_parse[1]]
              : "";
        else _val = _val[field.key];
        _field = (
          <TextField
            name={field.key}
            value={_val || (field?.defaultValue ?? "")}
            onChange={this.handleChangeValue}
            helperText={_findKey >= 0 ? _errArr[_findKey].msg : ""}
            error={_findKey >= 0 ? true : false}
            InputProps={{
              readOnly: _readOnly,
            }}
            disabled={_readOnly || false}
          />
        );
        break;
    }
    return _field;
  };

  async handleProcessSubmit(e) {
    e.preventDefault();
    const tab_endpoint = e?.currentTarget?.dataset?.tab_endpoint;
    const success_msg =
      e?.currentTarget?.dataset?.success_msg ?? "Cập nhật thành công";
    const isClose = e?.currentTarget?.dataset?.isclose == "true";
    let _form = document.getElementById("form");
    let _data = new FormData(_form);
    if (this.state.isLoading == false && tab_endpoint) {
      this.setState({ isLoading: true });
      let _obj = {};
      _data.forEach((val, key) => {
        let _findIndex = _.findIndex(this.props.fields, { key: key });
        if (this.props?.fields[_findIndex]?.type == "status") {
          val = this.state.values[key] == true || val == "on" ? true : false;
        }
        if (this.props?.fields[_findIndex]?.type == "image") {
          if (_data.get(key).name != "" && this.state.values[key] != "") {
            val = {
              file: this.state.values[key],
              name: _data.get(key).name,
            };
            if (this.state.id != "" && this.state.oldFile)
              val["oldFile"] = this.state.oldFile.replace(
                process.env.CDN_URL,
                ""
              );
          } else if (key.split(".").length > 1) {
            key.split(".").forEach((k, ind) => {
              if (ind == 0) val = this.state.values[k];
              else val = val?.[k] ?? "";
            });
          } else val = "";
        }
        if (this.props?.fields[_findIndex]?.type == "video") {
          if (_data.get(key).name != "" && this.state.values[key] != "") {
            val = {
              file: this.state.values[key],
              name: _data.get(key).name,
            };
            if (this.state.id != "" && this.state.oldFile)
              val["oldFile"] = this.state.oldFile.replace(
                process.env.CDN_URL,
                ""
              );
          } else val = this.state.values[key] ?? "";
        }
        if (this.props?.fields[_findIndex]?.type == "multi_image") {
          val = this.state.values[key] ?? "";
        }
        if (
          this.state.values[key] &&
          this.props?.fields[_findIndex]?.type == "date"
        ) {
          val = new Date(this.state.values[key]);
        }
        if (
          this.state.values[key] &&
          this.props?.fields[_findIndex]?.type == "dateTime"
        ) {
          val = new Date(this.state.values[key]);
        }
        if (this.props?.fields[_findIndex]?.type == "tags") {
          if (
            this.state.tags[this.props?.fields[_findIndex].key] &&
            this.state.tags[this.props?.fields[_findIndex].key].length > 0
          ) {
            val = _.join(
              this.state.tags[this.props?.fields[_findIndex].key],
              ","
            );
          } else val = "";
        }
        if (
          this.props?.fields[_findIndex]?.type == "autoComplete" ||
          this.props?.fields[_findIndex]?.type == "select_multi"
        ) {
          val = this.state.values[key] ? this.state.values[key] : val;
        }
        if (key.split(".").length > 1) {
          let _val = _obj[key.split(".")[0]] ?? {};
          key.split(".").forEach((k, ind, arr) => {
            if (ind == arr.length - 1) _val[k] = val;
            else if (ind > 0) _val[k] = {};
          });
          _obj[key.split(".")[0]] = _val;
        } else _obj[key] = val && val ? val : undefined;
      });
      const { id } = this.state.values;
      this._isMounted && this.setState({ isLoading: true });
      const _result = await putApi(
        process.env.PREFIX_API + this.state.module + `/${id}/${tab_endpoint}`,
        _obj,
        this.props.stateAccount.access_token
      );
      if (_result == "" || _result?.status == "success") {
        this._isMounted && this.props.handleSuccess(success_msg);
        if (isClose) {
          setTimeout(() => {
            this._isMounted && this.setState({ errors: [] });
            Router.push("/" + this.state.module);
          }, 1000);
          this.props.setFormLayout(false);
        }
      } else {
        if (typeof _result.response.data.errors?.msg === "string") {
          this._isMounted &&
            this.props.handleFailure(_result.response.data.errors.msg);
        } else {
          let _numErrTab = {};
          if (
            _result.response.data.errors?.length > 0 &&
            this.props.tabPlatform
          ) {
            _result.response.data.errors.forEach((item) => {
              const indKey = _.findIndex(this.props.fields, { key: item.key });
              if (indKey > -1 && this.props.fields[indKey]?.tabKey) {
                _numErrTab[this.props.fields[indKey].tabKey] =
                  (_numErrTab?.[this.props.fields[indKey].tabKey] ?? 0) + 1;
              }
            });
          }
          this._isMounted &&
            this.setState({
              errors: _result.response.data.errors,
              numberErrTab: _numErrTab,
            });
        }
      }
      this._isMounted && this.setState({ isLoading: false });
    }
  }
  handleDeleteTag = (value, data) => {
    let values = this.state.values["fields"];
    const newtags = data?.option?.filter((val) => val !== value);
    values.map((value, ind) => {
      value["option"] = newtags;
      this.setState({
        [data.key]: newtags,
        values: { ...this.state.values, [data.key]: values },
      });
    });
  };

  render() {
    let { isAlert, openPopupEdit, module, kpiMonth, tabPlatForm, tabEvent, numberErrTab } = this.state;
    return (
      <>
        <form id="form" onSubmit={this.handleSubmit}>
          {this.props.tabPlatform ? (
            <>
              <DialogContent>
                <Tabs value={tabEvent} onChange={this.handleTabEvent}>
                  {this.props.tabPlatformData.map((value, key) => {
                    return (
                      <Tab
                        key={key}
                        label={
                          <Badge
                            style={{ padding: 5 }}
                            invisible={!numberErrTab?.[value.key]}
                            color="error"
                            badgeContent={numberErrTab?.[value.key] ?? 0}
                          >
                            {value.name}
                          </Badge>
                        }
                        value={value.key}
                      />
                    );
                  })}
                </Tabs>
                <div className="cardBody card-tab-wrapper">
                  <div className={"form-root p-0 formLayout-" + module}>
                    {this.props.tabPlatformData.map((value) => {
                      return (
                        <div
                          className={`tab-${value.key} ${
                            value.key == tabEvent ? "show" : "hidden"
                          }`}
                          key={value.key}
                        >
                          {[...this.props.fields, ...this.state.morekeys].map(
                            (field) => {
                              if (field.tabKey == value.key) {
                                return (
                                  <>
                                    <div
                                      key={field.key}
                                      className={`_r row ${
                                        this.state.hiddenField.includes(
                                          field.key
                                        )
                                          ? "hidden"
                                          : ""
                                      }`}
                                    >
                                      <label
                                        htmlFor={field.key}
                                        className="col-lg-2 formLabel d-flex justify-content-end align-items-center text-lg-end text-start"
                                      >
                                        {field.label}
                                        {field.isRequired && (
                                          <span className="ms-1 color-primary">
                                            *
                                          </span>
                                        )}
                                      </label>
                                      <div className="col-lg-10 formControl">
                                        {this.showFields(field)}
                                      </div>
                                    </div>
                                    {field.key == "round_count" &&
                                      this.state.values?.["round_range"]?.map(
                                        (range, ind, arr) => {
                                          return (
                                            <div
                                              key={ind}
                                              className="row"
                                              style={{ marginBottom: 10 }}
                                            >
                                              <label
                                                htmlFor={field.key}
                                                className="col-lg-2 formLabel d-flex justify-content-end align-items-center text-lg-end text-start"
                                              >
                                                {`Vòng ${ind + 1}`}
                                                <span className="ms-1 color-primary">
                                                  *
                                                </span>
                                              </label>
                                              <div
                                                className="col-lg-10"
                                                style={{
                                                  borderBottom:
                                                    ind != arr.length - 1
                                                      ? "1px solid #eee"
                                                      : 0,
                                                  paddingBottom: 10,
                                                }}
                                              >
                                                {this.showFields({
                                                  type: "round_range",
                                                  index: ind,
                                                  minDate:
                                                    arr?.[ind - 1]
                                                      ?.publish_date,
                                                })}
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    {field.key == "poll_item_type_id" &&
                                      value.key == "config_poll" && (
                                        <div className="_r row">
                                          <div className="col-lg-2" />
                                          <div
                                            noValidate
                                            autoComplete="off"
                                            className="formSearch col-lg-10"
                                          >
                                            <div className="block">
                                              <input
                                                type="text"
                                                value={this.state.search || ""}
                                                onChange={(e) => {
                                                  e.preventDefault();
                                                  this.setState({
                                                    ...this.state,
                                                    search: e.target.value,
                                                  });
                                                }}
                                                placeholder="Nội dung tìm kiếm ..."
                                                disabled={
                                                  this.props?.detail ||
                                                  this.state.readOnly.includes(
                                                    "poll_items"
                                                  )
                                                }
                                              />
                                              <button
                                                onClick={async (e) => {
                                                  e.preventDefault();
                                                  const find =
                                                    this.props.fields.find(
                                                      (val) =>
                                                        val.key ==
                                                        "poll_item_type_id"
                                                    );
                                                  if (find) {
                                                    const _func =
                                                      find.onForChange.func;
                                                    const data = await _func(
                                                      this.state.values[
                                                        "poll_item_type_id"
                                                      ],
                                                      this.props.stateAccount
                                                        .access_token,
                                                      this.state.search &&
                                                        `&s=${this.state.search}|name`
                                                    );
                                                    this.setState({
                                                      data: {
                                                        ...this.state.data,
                                                        [find.onForChange.key]:
                                                          data,
                                                      },
                                                    });
                                                  }
                                                }}
                                                disabled={
                                                  this.props?.detail ||
                                                  this.state.readOnly.includes(
                                                    "poll_items"
                                                  )
                                                }
                                              >
                                                <i className="fal fa-search"></i>
                                              </button>
                                            </div>
                                          </div>
                                          <div className="col-lg-2" />
                                          <div className="col-lg-10">
                                            <List
                                              dense
                                              sx={{
                                                width: "100%",
                                                overflow: "auto",
                                                maxHeight: 640,
                                                bgcolor: "background.paper",
                                              }}
                                            >
                                              {this.state.data?.[
                                                "poll_items"
                                              ]?.map((value) => {
                                                const _readOnly =
                                                  this.props?.detail ||
                                                  this.state.readOnly.includes(
                                                    "poll_items"
                                                  );
                                                const labelId = `checkbox-list-secondary-label-${value?.id}`;
                                                return (
                                                  <ListItem
                                                    key={value?.id}
                                                    onClick={() => {
                                                      if (_readOnly) return;
                                                      this.handleToggle(
                                                        value.id
                                                      );
                                                    }}
                                                    secondaryAction={
                                                      <Checkbox
                                                        edge="end"
                                                        checked={
                                                          this.state?.checked?.some(
                                                            (id) =>
                                                              id == value.id
                                                          ) ?? false
                                                        }
                                                        inputProps={{
                                                          "aria-labelledby":
                                                            labelId,
                                                        }}
                                                        disabled={_readOnly}
                                                      />
                                                    }
                                                    disablePadding
                                                  >
                                                    <ListItemButton>
                                                      <ListItemAvatar>
                                                        <Avatar
                                                          alt={`Avatar n${
                                                            value + 1
                                                          }`}
                                                          src={
                                                            value.images?.[0]
                                                              ?.image_link
                                                              ? process.env
                                                                  .CDN_URL_S3 +
                                                                value
                                                                  .images?.[0]
                                                                  ?.image_link
                                                              : "/images/transparent.png"
                                                          }
                                                        />
                                                      </ListItemAvatar>
                                                      <ListItemText
                                                        id={labelId}
                                                        primary={value?.name}
                                                      />
                                                    </ListItemButton>
                                                  </ListItem>
                                                );
                                              })}
                                            </List>
                                          </div>
                                        </div>
                                      )}
                                  </>
                                );
                              }
                            }
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <div className="d-flex justify-content-end">
                  <Button
                    className="btn btn-light font-weight-bold"
                    variant="contained"
                    onClick={() =>
                      this.props.detail
                        ? this.handleDetailLayout()
                        : this.handleFormLayout()
                    }
                  >
                    Cancel
                  </Button>
                  {!this.props.detail && (
                    <Button
                      type="submit"
                      className="btn btn-primary font-weight-bold ms-3"
                      variant="contained"
                      disabled={this.state.isLoading == true ? true : false}
                    >
                      {this.state.isLoading ? (
                        <Spinkit name="sk-fading-circle" color="black" />
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  )}
                </div>
              </DialogActions>
            </>
          ) : (
            <>
              <DialogContent>
                <div className="row">
                  <div
                    className={
                      "col-lg-" +
                      (this.props.type !== "tab"
                        ? this.props.hideColRight
                          ? "12"
                          : "8"
                        : "6")
                    }
                  >
                    <div className="card">
                      <div className="cardHead">
                        <h4 className="cardTitle">
                          <span className="cardLabel">
                            {this.props.type === "tab"
                              ? "Name & Socials"
                              : "Thông tin"}
                          </span>
                        </h4>
                      </div>

                      <div className="cardBody">
                        <div className={"form-root p-0 formLayout-" + module}>
                          {[...this.props.fields, ...this.state.morekeys].map(
                            (field) =>
                              field.col == "left" && (
                                <>
                                  <div
                                    key={field.key}
                                    className={`_r row ${
                                      this.state.hiddenField.includes(field.key)
                                        ? "hidden"
                                        : ""
                                    }`}
                                  >
                                    <label
                                      htmlFor={field.key}
                                      className="col-lg-3 formLabel d-flex justify-content-end align-items-center text-lg-end text-start"
                                    >
                                      {field.label}
                                      {field.isRequired && (
                                        <span className="ms-1 color-primary">
                                          *
                                        </span>
                                      )}
                                    </label>
                                    <div className="col-lg-9 formControl">
                                      {this.showFields(field)}
                                    </div>
                                  </div>
                                  {field.key == "round_count" &&
                                    this.state.values?.["round_range"]?.map(
                                      (range, ind, arr) => {
                                        return (
                                          <div
                                            key={ind}
                                            className="row"
                                            style={{ marginBottom: 10 }}
                                          >
                                            <label
                                              htmlFor={field.key}
                                              className="col-lg-3 formLabel d-flex justify-content-end align-items-center text-lg-end text-start"
                                            >
                                              {`Vòng ${ind + 1}`}
                                              <span className="ms-1 color-primary">
                                                *
                                              </span>
                                            </label>
                                            <div
                                              className="col-lg-9"
                                              style={{
                                                borderBottom:
                                                  ind != arr.length - 1
                                                    ? "1px solid grey"
                                                    : 0,
                                                paddingBottom: 10,
                                              }}
                                            >
                                              {this.showFields({
                                                type: "round_range",
                                                index: ind,
                                                minDate:
                                                  arr?.[ind - 1]?.publish_date,
                                              })}
                                            </div>
                                          </div>
                                        );
                                      }
                                    )}
                                </>
                              )
                          )}

                          {kpiMonth.length > 0 &&
                            kpiMonth.map((el, key) => (
                              <div className="_r row" key={key}>
                                <label
                                  htmlFor={"tháng " + el}
                                  className="col-lg-3 formLabel d-flex justify-content-end align-items-center text-lg-end text-start"
                                >
                                  Tháng {el}
                                </label>

                                <div className="col-lg-9 formControl">
                                  <div className="d-flex align-items-center">
                                    <TextField
                                      required
                                      type="number"
                                      onChange={this.handleChangeValue}
                                      value={this.state.values[`view[${el}]`]}
                                      name={`view[${el}]`}
                                      inputProps={{
                                        placeholder: "KPI View",
                                        inputMode: "numeric",
                                        pattern: "[0-9]*",
                                      }}
                                      className="inputIcon"
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <i className="fas fa-eye"></i>
                                          </InputAdornment>
                                        ),
                                      }}
                                    />
                                    <Box sx={{ mx: 2 }}> and </Box>
                                    <TextField
                                      required
                                      onChange={this.handleChangeValue}
                                      value={
                                        this.state.values[`revenue[${el}]`]
                                      }
                                      name={`revenue[${el}]`}
                                      inputProps={{
                                        placeholder: "KPI Doanh thu",
                                        inputMode: "numeric",
                                        pattern: "[0-9]*",
                                      }}
                                      className="inputIcon"
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <i className="fas fa-dollar-sign"></i>
                                          </InputAdornment>
                                        ),
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!this.props.hideColRight && (
                    <div
                      className={
                        "col-lg-" + (this.props.type === "tab" ? "6" : "4")
                      }
                    >
                      <div className="card mb-25">
                        <div className="cardHead">
                          <h4 className="cardTitle">
                            <span className="cardLabel">
                              {this.props.type === "tab"
                                ? "Profile Details"
                                : "Thiết lập"}
                            </span>
                          </h4>
                        </div>

                        <div className="cardBody">
                          <div className="form-root p-0">
                            {this.props.fields.map(
                              (field) =>
                                field.col == "right" &&
                                ((field.key != "influencer_group_id" &&
                                  field.key != "influencer_manager_id") ||
                                  !this.props.router.query?.token) && (
                                  <div
                                    className={`_r ${
                                      this.state.hiddenField.includes(field.key)
                                        ? "hidden"
                                        : ""
                                    }`}
                                    key={field.key}
                                  >
                                    <label
                                      htmlFor={field.key}
                                      className="formLabel"
                                    >
                                      {field.label}
                                      {field.isRequired && (
                                        <span className="ms-1 color-primary">
                                          *
                                        </span>
                                      )}
                                    </label>
                                    {[
                                      "status",
                                      "is_shownumbervote",
                                      "is_luckyuser",
                                    ].includes(field.key) ? (
                                      this.showFields(field)
                                    ) : (
                                      <div className="formControl mt-2">
                                        {this.showFields(field)}
                                      </div>
                                    )}
                                  </div>
                                )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogActions>
                    <div className="d-flex justify-content-end">
                      <Button
                        className="btn btn-light btn-active-primary font-weight-bold"
                        variant="contained"
                        onClick={this.handleFormLayout}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="btn btn-primary font-weight-bold ms-3"
                        variant="contained"
                      >
                        Submit
                      </Button>
                    </div>
                  </DialogActions>
                </div>
              </DialogContent>
            </>
          )}
        </form>
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
  connect(mapStateToProps, mapDispatchToProps)(FormLayout)
);