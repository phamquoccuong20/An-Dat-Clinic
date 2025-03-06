"use strict";

/* Package System */
import React from "react";
import Router, { withRouter } from "next/router";
import { connect } from "react-redux";
import _ from "lodash";

/* Package Application */
import { handleFailure, handleSuccess, setRoleLayout } from "@features/Status";
import {
  FormControl,
  InputLabel,
  Checkbox,
  TextField,
  Box,
  DialogContent,
  MenuItem,
  FormControlLabel,
  Tooltip,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Select,
  FormHelperText,
  Autocomplete,
} from "@mui/material";
import {
  fetchApi,
  postApi,
  putApi,
  capitalize,
  cleanEmpty,
} from "@utils/Helper";
import Spinkit from "@views/Admin/Components/Spinkit";

class RoleLayout extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {
      module: props.router.query.pages[0] ?? "",
      id: props.stateStatus?.roleLayout?.id ?? "",
      data: {
        field_type: [{ value: "input", label: "Text" }],
      },
      values: {},
      errors: [],
      modules: [],
      isCheckedAll: false,
      isCheck: [],
      isLoading: false,
      tabEvent: this.props?.tabPlatformActive ?? "",
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    if (this.state.id != "" && !this.props?.router?.query?.token) {
      let _result;
      let _url = process.env.PREFIX_API + this.state.module;
      _result = await fetchApi(
        _url + "/" + this.state.id,
        this.props.stateAccount.access_token
      );
      if (_result?.data?.permissions) {
        let _permissions = JSON.parse(JSON.stringify(_result.data.permissions));
        let _modules = [];
        for (let [_k, _v] of Object.entries(_permissions)) {
          if (_v.read == true) _modules.push("role_r_" + _k);
          if (_v.write == true) _modules.push("role_w_" + _k);
          if (_v.create == true) _modules.push("role_c_" + _k);
          if (_v.delete == true) _modules.push("role_d_" + _k);
        }
        this._isMounted && this.setState({ isCheck: _modules });
      }
      if (_result?.data?.db_filters) {
        const filters = JSON.parse(JSON.stringify(_result.data.db_filters));
        let _fields = {};
        let _targetModule = new Set();
        Object.keys(filters).forEach((module) => {
          const query = filters[module];
          const field_query = query.hasOwnProperty("fq") ? "fq" : "fqor";
          if (query?.target_module) _targetModule.add(query.target_module);
          if (field_query == "fq")
            _fields[module] = {
              field_target_module: query?.target_module ?? "",
              field_target_field: query?.target_field ?? "",
              field_query,
              field_value: query[field_query]?.split(":")?.[1],
              field_field: query[field_query]?.split(":")?.[0],
            };
          else if (field_query == "fqor")
            _fields[module] = {
              field_target_module: query?.target_module ?? "",
              field_target_field: query?.target_field ?? "",
              field_query,
              field_value: query[field_query]?.split("|")?.[0],
              field_field: query[field_query]?.split("|")?.[1],
            };
        });
        _targetModule = [..._targetModule];
        if (_targetModule.length > 0) {
          const initData = await Promise.all(
            _targetModule.map((module) => {
              return fetchApi(
                process.env.PREFIX_API + `modules/get-target/${module}`,
                this.props.stateAccount?.access_token
              )
                .then((resp) => resp ?? {})
                .catch((e) => {});
            })
          );
          let _dataTargetField = {};
          let _dataTargetValue = {};
          initData?.forEach((item, ind) => {
            _dataTargetField[_targetModule[ind]] = item?.keyTarget ?? [];
            _dataTargetValue[_targetModule[ind]] = item?.dataTarget ?? [];
          });
          this._isMounted &&
            this.setState({
              data: {
                ...this.state.data,
                field_target_field: _dataTargetField,
                field_value: _dataTargetValue,
              },
            });
        }
        _result.data["fields"] = _fields;
      }
      this._isMounted && this.setState({ values: { ..._result.data } });
    }
    // Get Data
    if (this.props.getData && !this.props?.router?.query?.token) {
      for (const [key, value] of Object.entries(this.props.getData)) {
        let _url =
          value.indexOf("http") >= 0 ? value : process.env.PREFIX_API + value;
        let _data = await fetchApi(_url, this.props.stateAccount.access_token);
        if (_data?.status == "success") {
          this._isMounted && this.setState({ modules: _data?.data });
        }
      }
    }
  }

  handleRoleLayout = () => {
    let _status = !this.props.stateStatus.roleLayout.status;
    this.props.setRoleLayout({
      status: _status,
      title: "",
      width: "",
      type: "",
    });
  };

  handleChangeValue = async (e) => {
    let _value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    let _err = this.state.errors;
    let _findKey = _.findIndex(_err, { key: e.target?.name });
    if (_value != "") {
      delete _err[_findKey];
      this.setState({ errors: _err });
    }
    if (e.target.type === "checkbox") {
      const { checked } = e.target;
      const name = e.target.name;
      if (!checked) {
        this.setState({
          isCheck: this.state.isCheck.filter((item) => item != name),
        });
      } else {
        this.setState({ isCheck: [...this.state.isCheck, name] });
      }
    } else {
      this.setState({
        values: { ...this.state.values, [e.target.name]: _value },
      });
    }
  };

  handleSelectedAll = async (e) => {
    this.setState({ isCheckedAll: !this.state.isCheckedAll });

    if (this.state.isCheckedAll) {
      this.setState({ isCheck: [] });
    } else {
      let _modules = [];
      // _modules.push('role_r_default');
      // _modules.push('role_w_default');
      // _modules.push('role_d_default');
      this.state.modules.map((v) => {
        _modules.push("role_r_" + v.module);
        _modules.push("role_w_" + v.module);
        _modules.push("role_c_" + v.module);
        _modules.push("role_d_" + v.module);
      });
      this.setState({ isCheck: _modules });
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    let _form = document.getElementById("form");
    let _data = new FormData(_form);
    if (
      this.state.isLoading == false &&
      cleanEmpty(this.state.errors).length <= 0
    ) {
      this.setState({ isLoading: true });
      let _obj = {};
      _obj.permissions = {
        // default:{
        // 	'read':this.state.isCheck.includes('role_r_default'),
        // 	'write':this.state.isCheck.includes('role_w_default'),
        // 	'create':this.state.isCheck.includes('role_c_default'),
        // 	'delete':this.state.isCheck.includes('role_d_default')
        // }
      };
      _data.forEach((val, key) => {
        if (key == "name" || key == "level" || key == "db_filters")
          _obj[key] = val && val != null ? val : "";
      });

      this.state.modules.map((v) => {
        _obj.permissions[v.module] = {
          read: this.state.isCheck.includes("role_r_" + v.module),
          write: this.state.isCheck.includes("role_w_" + v.module),
          create: this.state.isCheck.includes("role_c_" + v.module),
          delete: this.state.isCheck.includes("role_d_" + v.module),
        };
      });
      _obj.permissions = JSON.stringify(_obj.permissions);
      if (
        this.state.values?.["fields"] &&
        _.isEmpty(Object.entries(this.state.values?.["fields"])) == false
      ) {
        let _dataFilters = {};
        for (const [key, value] of Object.entries(
          this.state.values["fields"]
        )) {
          _dataFilters[key] = {};
          if (
            value["field_query"] &&
            value["field_field"] &&
            value["field_value"]
          ) {
            if (value["field_query"] == "fq")
              _dataFilters[key][
                value["field_query"]
              ] = `${value["field_field"]}:${value["field_value"]}`;
            else if (value["field_query"] == "fqor")
              _dataFilters[key][
                value["field_query"]
              ] = `${value["field_value"]}|${value["field_field"]}`;
          }
          if (value["field_target_module"])
            _dataFilters[key]["target_module"] = value["field_target_module"];
          if (value["field_target_field"])
            _dataFilters[key]["target_field"] = value["field_target_field"];
        }
        _obj["db_filters"] = JSON.stringify(_dataFilters);
      }

      //Remove object empty
      for (let _key in _obj) {
        if (_.isString(_obj[_key]) == true && _.isEmpty(_obj[_key]) == true) {
          delete _obj[_key];
        }
      }

      let _result;
      let _url = process.env.PREFIX_API + this.state.module;
      if (this.state.id == "")
        _result = await postApi(
          _url,
          _obj,
          this.props.stateAccount.access_token
        );
      else {
        _result = await putApi(
          _url + "/" + this.state.id,
          _obj,
          this.props.stateAccount.access_token
        )
          .then((resp) => resp)
          .catch((e) => e);
      }

      if (_result == "" || _result.status == "success") {
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
        } else {
          this._isMounted && this.props.handleSuccess("Cập nhật thành công");
          setTimeout(() => {
            this._isMounted && this.setState({ isLoading: false, errors: [] });
            if (!this.props.stateStatus?.formLayout?.type) {
              Router.push("/" + this.state.module);
            }
            //this.props.stateStatus.formLayout.get();
          }, 1000);
        }
        this.props.setRoleLayout(false);
      } else {
        if (typeof _result.response.data.errors?.msg === "string") {
          this._isMounted &&
            this.props.handleFailure(_result.response.data.errors.msg);
        } else {
          this._isMounted &&
            this.setState({ errors: _result.response.data.errors });
        }
        this._isMounted && this.setState({ isLoading: false });
      }
    }
  };
  handleTabEvent = (e, newValue) => {
    const _values = new Set();
    if (newValue == "system" && this.state.isCheck.length > 0) {
      this.state.isCheck.forEach((item) => {
        const _module = item.split("_")?.[2];
        _values.add(_module);
      });
    }
    this.setState({
      tabEvent: newValue,
      data: {
        ...this.state.data,
        field_module: [..._values]?.map((val) => ({ value: val, label: val })),
      },
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

    switch (field.type) {
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
      case "addMoreList":
        let values = this.state.values?.[field.key] ?? [];
        _field = (
          <>
            {values.length > 0 &&
              values.map((value, ind) => {
                return (
                  <div className="row _r" key={`addMoreList-$${ind}`}>
                    <div
                      className="col-lg-6 formControl"
                      key={`addMoreList-type-$${ind}`}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                      >
                        <label className="formLabel">
                          Type
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
                          {[{ value: "input", label: "Text" }].map((v) => (
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
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-6 formControl"
                      style={{ marginBottom: 20 }}
                      key={`addMoreList-key-$${ind}`}
                    >
                      <FormControl fullWidth className="selectCustom">
                        <label className="formLabel">
                          Key
                          <span className="ms-1 color-primary">*</span>
                        </label>
                        <TextField
                          value={value.key ?? ""}
                          helperText={
                            _errArr?.find(
                              (err) => err.key == `${field.key}[${ind}].key`
                            )?.msg ?? ""
                          }
                          error={
                            !!_errArr?.find(
                              (err) => err.key == `${field.key}[${ind}].key`
                            )?.msg
                          }
                          onChange={(e) => {
                            const _indexErr = _.findIndex(_errArr, {
                              key: `${field.key}[${ind}].key`,
                            });
                            if (_indexErr > -1) {
                              _errArr = _errArr.filter(
                                (_, i) => i != _indexErr
                              );
                            }
                            value["key"] = e.target.value;
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
                      className="col-lg-4 formControl"
                      style={{ marginBottom: 20 }}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        key={`addMoreList-label-$${ind}`}
                      >
                        <label className="formLabel">
                          Label
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
                    <div className="col-lg-4 formControl">
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                        key={`addMoreList-sort-$${ind}`}
                      >
                        <label className="formLabel">Sort</label>
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
                      className="col-lg-4 formControl"
                      style={{ margin: "auto" }}
                      key={`addMoreList-btn-$${ind}`}
                    >
                      <Button
                        className="tt-btn btn btn-light"
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
                        <i className="fa fa-minus"></i>
                      </Button>
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
              <div
                className="col-lg-2"
                style={{ marginBottom: 10 }}
                key={`addMore-field_module-title`}
              >
                <label htmlFor={"field_module"} className="formLabel">
                  Module
                </label>
              </div>
              <div
                className="col-lg-2 formControl"
                style={{ marginBottom: 10 }}
                key={`addMore-query-title`}
              >
                <label htmlFor={"field_module"} className="formLabel">
                  Query
                </label>
              </div>
              <div
                className="col-lg-2"
                style={{ marginBottom: 10 }}
                key={`addMore-field-title`}
              >
                <label htmlFor={"field"} className="formLabel">
                  Field
                </label>
              </div>
              <div
                className="col-lg-2"
                style={{ marginBottom: 10 }}
                key={`addMore-target-module-title`}
              >
                <label htmlFor={"field_module"} className="formLabel">
                  Target module
                </label>
              </div>
              <div
                className="col-lg-2"
                style={{ marginBottom: 10 }}
                key={`addMore-target-field-title`}
              >
                <label htmlFor={"field_module"} className="formLabel">
                  Target field
                </label>
              </div>
              <div
                className="col-lg-2"
                style={{ marginBottom: 10 }}
                key={`addMore-value-title`}
              >
                <label htmlFor={"field_module"} className="formLabel">
                  Value
                </label>
              </div>
              {this.state.data["field_module"]?.map((module, ind) => {
                return (
                  <>
                    <div
                      className="col-lg-2"
                      style={{ marginTop: 10 }}
                      key={`addMore-field_module-${ind}`}
                    >
                      {module.value}
                    </div>
                    <div
                      className="col-lg-2 formControl"
                      key={`addMore-field_query-${ind}`}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                      >
                        <Select
                          value={values?.[module.value]?.["field_query"] ?? ""}
                          onChange={(e) => {
                            values[module.value] = values?.[module.value] ?? {};
                            values[module.value]["field_query"] =
                              e.target.value;
                            this.setState({
                              values: {
                                ...this.state.values,
                                [field.targetField]: values,
                              },
                            });
                          }}
                        >
                          {[
                            { value: "fq", label: "Where" },
                            { value: "fqor", label: "Where not" },
                          ].map((v) => (
                            <MenuItem key={v.value} value={v.value}>
                              {v.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-2 formControl"
                      key={`addMore-field_field-${ind}`}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                      >
                        <TextField
                          name={"field_field"}
                          value={values?.[module.value]?.["field_field"] ?? ""}
                          onChange={(e) => {
                            values[module.value] = values?.[module.value] ?? {};
                            values[module.value][e.target.name] =
                              e.target.value;
                            this.setState({
                              values: {
                                ...this.state.values,
                                [field.targetField]: values,
                              },
                            });
                          }}
                        />
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-2 formControl"
                      key={`addMore-field_target_module-${ind}`}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                      >
                        <Select
                          name={"field_target_module"}
                          value={
                            values?.[module.value]?.["field_target_module"] ??
                            ""
                          }
                          onChange={async (e) => {
                            values[module.value] = values?.[module.value] ?? {};
                            values[module.value][e.target.name] =
                              e.target.value;
                            const dataTargetField =
                              this.state.data["field_target_field"] ?? {};
                            const dataTargetValue =
                              this.state.data["field_value"] ?? {};
                            if (!dataTargetField?.[e.target.value]) {
                              const value = await fetchApi(
                                process.env.PREFIX_API +
                                  `modules/get-target/${e.target.value}`,
                                this.props.stateAccount?.access_token
                              )
                                .then((resp) => resp ?? {})
                                .catch((e) => {});
                              dataTargetField[e.target.value] =
                                value?.keyTarget ?? [];
                              dataTargetValue[e.target.value] =
                                value?.dataTarget ?? [];
                            }
                            this.setState({
                              data: {
                                ...this.state.data,
                                field_target_field: dataTargetField,
                                field_value: dataTargetValue,
                              },
                              values: {
                                ...this.state.values,
                                [field.targetField]: values,
                              },
                            });
                          }}
                        >
                          {this.state["modules"]?.map((v) => (
                            <MenuItem key={v.id} value={v.module}>
                              {v.module}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-2 formControl"
                      key={`addMore-field_target_field-${ind}`}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                      >
                        <Select
                          name={"field_target_field"}
                          value={
                            values?.[module.value]?.["field_target_field"] ?? ""
                          }
                          onChange={async (e) => {
                            values[module.value] = values?.[module.value] ?? {};
                            values[module.value][e.target.name] =
                              e.target.value;
                            this.setState({
                              values: {
                                ...this.state.values,
                                [field.targetField]: values,
                              },
                            });
                          }}
                        >
                          {this.state.data["field_target_field"]?.[
                            values[module.value]?.["field_target_module"]
                          ]?.map((v) => (
                            <MenuItem key={v} value={v}>
                              {v}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                    <div
                      className="col-lg-2 formControl"
                      key={`addMore-field_value-${ind}`}
                    >
                      <FormControl
                        fullWidth
                        className="selectCustom"
                        style={{ marginBottom: 20 }}
                      >
                        <Select
                          name={"field_value"}
                          value={values?.[module.value]?.["field_value"] ?? ""}
                          onChange={async (e) => {
                            values[module.value] = values?.[module.value] ?? {};
                            values[module.value][e.target.name] =
                              e.target.value;
                            this.setState({
                              values: {
                                ...this.state.values,
                                [field.targetField]: values,
                              },
                            });
                          }}
                        >
                          {values[module.value]?.["field_target_field"] == "id"
                            ? this.state.data["field_value"]?.[
                                values[module.value]?.["field_target_module"]
                              ]?.map((v) => (
                                <MenuItem key={v.id} value={v.id}>
                                  {v.name ?? v.customer_name ?? v.title}
                                </MenuItem>
                              ))
                            : this.state.data["field_value"]?.[
                                values[module.value]?.["field_target_module"]
                              ]?.map((v) => (
                                <MenuItem
                                  key={v.id}
                                  value={
                                    v[
                                      values[module.value]["field_target_field"]
                                    ]
                                  }
                                >
                                  {
                                    v[
                                      values[module.value]["field_target_field"]
                                    ]
                                  }
                                </MenuItem>
                              ))}
                        </Select>
                      </FormControl>
                    </div>
                  </>
                );
              })}
            </div>
          </>
        );
        break;
      default:
        let _val = this.state.values;
        let _parse = field.key.split(".");
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

  render() {
    let { values, isCheck, tabEvent } = this.state;
    let _findKey;
    let _errArr = this.state.errors;
    let _groupName = "";
    let _modules = this.state.modules;
    _modules.map((v) => {
      let n = v.name.split(" - ");
      v.group_name = n[0];
    });
    if (_errArr?.length > 0) _findKey = _.findIndex(_errArr, { key: "name" });
    let { is_admin } = this.props.stateAccount;
    return (
      <>
        <div className="role-root">
          <form id="form" onSubmit={this.handleSubmit}>
            {this.props.tabPlatform ? (
              <>
                <DialogContent>
                  <Tabs value={tabEvent} onChange={this.handleTabEvent}>
                    {this.props.tabPlatformData.map((value, key) => {
                      return (
                        <Tab key={key} label={value.name} value={value.key} />
                      );
                    })}
                  </Tabs>
                  <div className="cardBody card-tab-wrapper">
                    <div className={"form-root p-0 formLayout-" + module}>
                      {this.props.tabPlatformData.map((value) => {
                        if (value.key == "info")
                          return (
                            <div
                              className={`tab-${value.key} ${
                                value.key == tabEvent ? "show" : "hidden"
                              }`}
                              key={value.key}
                            >
                              <div className="row">
                                <div className="col-lg-12">
                                  <div className="card">
                                    <div className="cardBody">
                                      <div className="form-root p-0">
                                        <div className="_r">
                                          <div className="row">
                                            <div className="col-lg-12">
                                              <label
                                                htmlFor="role-name"
                                                className="formLabel"
                                              >
                                                <strong
                                                  style={{ fontSize: "1.8rem" }}
                                                >
                                                  Role name
                                                </strong>
                                                <span className="ms-1 color-primary">
                                                  *
                                                </span>
                                              </label>
                                            </div>

                                            <div className="col-lg-12">
                                              <TextField
                                                helperText={
                                                  _findKey >= 0
                                                    ? _errArr[_findKey].msg
                                                    : ""
                                                }
                                                error={
                                                  _findKey >= 0 ? true : false
                                                }
                                                name="name"
                                                value={
                                                  this.state.values["name"] ||
                                                  ""
                                                }
                                                onChange={
                                                  this.handleChangeValue
                                                }
                                              />
                                            </div>
                                            {is_admin && (
                                              <>
                                                <div className="col-lg-12">
                                                  <label
                                                    htmlFor="role-name"
                                                    className="formLabel"
                                                  >
                                                    <strong
                                                      style={{
                                                        fontSize: "1.8rem",
                                                      }}
                                                    >
                                                      Data Filter
                                                    </strong>
                                                  </label>
                                                </div>

                                                <div className="col-lg-12">
                                                  <TextField
                                                    helperText={
                                                      _findKey >= 0
                                                        ? _errArr[_findKey].msg
                                                        : ""
                                                    }
                                                    error={
                                                      _findKey >= 0
                                                        ? true
                                                        : false
                                                    }
                                                    name="db_filters"
                                                    value={
                                                      typeof (
                                                        this.state.values[
                                                          "db_filters"
                                                        ] !== undefined
                                                      )
                                                        ? this.state.values[
                                                            "db_filters"
                                                          ]
                                                        : ""
                                                    }
                                                    onChange={
                                                      this.handleChangeValue
                                                    }
                                                    disabled
                                                  />
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        <div className="_r">
                                          <div className="row">
                                            <div className="col-lg-12">
                                              <label className="formLabel">
                                                <strong
                                                  style={{ fontSize: "1.8rem" }}
                                                >
                                                  Role Permissions
                                                </strong>
                                              </label>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="_r">
                                          <div className="row align-items-center">
                                            <div className="col-lg-4">
                                              <label className="formLabel">
                                                Administrator Access
                                                <Tooltip
                                                  title="Rule"
                                                  arrow
                                                  placement="right"
                                                >
                                                  <i className="fas fa-info-circle ms-2"></i>
                                                </Tooltip>
                                              </label>
                                            </div>

                                            <div className="col-lg-8">
                                              <div className="row">
                                                <div className="col-lg-4">
                                                  <FormControl component="fieldset">
                                                    <FormControlLabel
                                                      className="wp-100"
                                                      control={
                                                        <Checkbox
                                                          name="all"
                                                          onChange={
                                                            this
                                                              .handleSelectedAll
                                                          }
                                                          icon={
                                                            <span className="cbx" />
                                                          }
                                                          checkedIcon={
                                                            <span className="cbx cbx-primary" />
                                                          }
                                                          checked={
                                                            this.state
                                                              .isCheckedAll
                                                          }
                                                        />
                                                      }
                                                      label="Select all"
                                                    />
                                                  </FormControl>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {_modules &&
                                            _.orderBy(
                                              _modules,
                                              ["sort_order"],
                                              ["asc"]
                                            ).map((module) => {
                                              let _groupNameHtml = "";
                                              if (
                                                module.group_name !== _groupName
                                              ) {
                                                _groupName = module.group_name;
                                                let _groupKey =
                                                  "group_" + module.id;
                                                _groupNameHtml = (
                                                  <label
                                                    key={_groupKey}
                                                    className="formLabel"
                                                  >
                                                    <strong
                                                      style={{
                                                        fontSize: "1.5rem",
                                                        lineHeight: "35px",
                                                        textDecoration:
                                                          "underline",
                                                      }}
                                                    >
                                                      {_groupName}
                                                    </strong>
                                                  </label>
                                                );
                                              }
                                              return (
                                                <>
                                                  {_groupNameHtml}
                                                  <div
                                                    key={module.id}
                                                    className="row align-items-center"
                                                  >
                                                    <div className="col-lg-4">
                                                      <label className="formLabel">
                                                        {capitalize(
                                                          module.module
                                                        )}
                                                      </label>
                                                    </div>

                                                    <div className="col-lg-8">
                                                      <div className="row">
                                                        <div className="col-lg-3">
                                                          <FormControl component="fieldset">
                                                            <FormControlLabel
                                                              className="wp-100"
                                                              control={
                                                                <Checkbox
                                                                  name={
                                                                    "role_r_" +
                                                                    module.module
                                                                  }
                                                                  data-name={
                                                                    "role_r_" +
                                                                    module.module
                                                                  }
                                                                  onChange={
                                                                    this
                                                                      .handleChangeValue
                                                                  }
                                                                  icon={
                                                                    <span className="cbx" />
                                                                  }
                                                                  checkedIcon={
                                                                    <span className="cbx cbx-primary" />
                                                                  }
                                                                  checked={isCheck.includes(
                                                                    "role_r_" +
                                                                      module.module
                                                                  )}
                                                                />
                                                              }
                                                              label="Read"
                                                            />
                                                          </FormControl>
                                                        </div>

                                                        <div className="col-lg-3">
                                                          <FormControl component="fieldset">
                                                            <FormControlLabel
                                                              className="wp-100"
                                                              control={
                                                                <Checkbox
                                                                  name={
                                                                    "role_c_" +
                                                                    module.module
                                                                  }
                                                                  data-name={
                                                                    "role_c_" +
                                                                    module.module
                                                                  }
                                                                  onChange={
                                                                    this
                                                                      .handleChangeValue
                                                                  }
                                                                  icon={
                                                                    <span className="cbx" />
                                                                  }
                                                                  checkedIcon={
                                                                    <span className="cbx cbx-primary" />
                                                                  }
                                                                  checked={isCheck.includes(
                                                                    "role_c_" +
                                                                      module.module
                                                                  )}
                                                                />
                                                              }
                                                              label="Create"
                                                            />
                                                          </FormControl>
                                                        </div>

                                                        <div className="col-lg-3">
                                                          <FormControl component="fieldset">
                                                            <FormControlLabel
                                                              className="wp-100"
                                                              control={
                                                                <Checkbox
                                                                  name={
                                                                    "role_w_" +
                                                                    module.module
                                                                  }
                                                                  data-name={
                                                                    "role_w_" +
                                                                    module.module
                                                                  }
                                                                  onChange={
                                                                    this
                                                                      .handleChangeValue
                                                                  }
                                                                  icon={
                                                                    <span className="cbx" />
                                                                  }
                                                                  checkedIcon={
                                                                    <span className="cbx cbx-primary" />
                                                                  }
                                                                  checked={isCheck.includes(
                                                                    "role_w_" +
                                                                      module.module
                                                                  )}
                                                                />
                                                              }
                                                              label="Edit"
                                                            />
                                                          </FormControl>
                                                        </div>

                                                        <div className="col-lg-3">
                                                          <FormControl component="fieldset">
                                                            <FormControlLabel
                                                              className="wp-100"
                                                              control={
                                                                <Checkbox
                                                                  name={
                                                                    "role_d_" +
                                                                    module.module
                                                                  }
                                                                  data-name={
                                                                    "role_d_" +
                                                                    module.module
                                                                  }
                                                                  onChange={
                                                                    this
                                                                      .handleChangeValue
                                                                  }
                                                                  icon={
                                                                    <span className="cbx" />
                                                                  }
                                                                  checkedIcon={
                                                                    <span className="cbx cbx-primary" />
                                                                  }
                                                                  checked={isCheck.includes(
                                                                    "role_d_" +
                                                                      module.module
                                                                  )}
                                                                />
                                                              }
                                                              label="Delete"
                                                            />
                                                          </FormControl>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </>
                                              );
                                            })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        return (
                          <div
                            className={`tab-${value.key} ${
                              value.key == tabEvent ? "show" : "hidden"
                            }`}
                            key={value.key}
                          >
                            {this.props.fields.map((field) => {
                              if (field.tabKey == value.key) {
                                return (
                                  <div key={field.key} className={`_r row`}>
                                    <div className="col-lg-12 formControl">
                                      {this.showFields(field)}
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DialogContent>
                <DialogActions>
                  <div className="d-flex justify-content-end">
                    <Button
                      className="btn btn-light btn-active-primary font-weight-bold"
                      variant="contained"
                      onClick={this.handleRoleLayout}
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
              </>
            ) : (
              <>
                <DialogContent>
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="card">
                        <div className="cardBody">
                          <div className="form-root p-0">
                            <div className="_r">
                              <div className="row">
                                <div className="col-lg-12">
                                  <label
                                    htmlFor="role-name"
                                    className="formLabel"
                                  >
                                    <strong style={{ fontSize: "1.8rem" }}>
                                      Role name
                                    </strong>
                                    <span className="ms-1 color-primary">
                                      *
                                    </span>
                                  </label>
                                </div>

                                <div className="col-lg-12">
                                  <TextField
                                    helperText={
                                      _findKey >= 0 ? _errArr[_findKey].msg : ""
                                    }
                                    error={_findKey >= 0 ? true : false}
                                    name="name"
                                    value={this.state.values["name"] || ""}
                                    onChange={this.handleChangeValue}
                                  />
                                </div>

                                {/* <div className="col-lg-12">
															<label htmlFor="role-name" className="formLabel">
																<strong style={{fontSize:'1.8rem'}}>Level</strong>
																<span className="ms-1 color-primary">*</span>
															</label>
														</div>

														<div className="col-lg-12">
															<TextField
																helperText={_findKey>=0?_errArr[_findKey].msg:''}
																error={_findKey>=0?true:false}
																name='level'
																value={typeof(this.state.values['level']!==undefined)?this.state.values['level']:''}
																onChange={this.handleChangeValue}
															/>
														</div> */}
                                {is_admin && (
                                  <>
                                    <div className="col-lg-12">
                                      <label
                                        htmlFor="role-name"
                                        className="formLabel"
                                      >
                                        <strong style={{ fontSize: "1.8rem" }}>
                                          Data Filter
                                        </strong>
                                      </label>
                                    </div>

                                    <div className="col-lg-12">
                                      <TextField
                                        helperText={
                                          _findKey >= 0
                                            ? _errArr[_findKey].msg
                                            : ""
                                        }
                                        error={_findKey >= 0 ? true : false}
                                        name="db_filters"
                                        value={
                                          typeof (
                                            this.state.values["db_filters"] !==
                                            undefined
                                          )
                                            ? this.state.values["db_filters"]
                                            : ""
                                        }
                                        onChange={this.handleChangeValue}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="_r">
                              <div className="row">
                                <div className="col-lg-12">
                                  <label className="formLabel">
                                    <strong style={{ fontSize: "1.8rem" }}>
                                      Role Permissions
                                    </strong>
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="_r">
                              <div className="row align-items-center">
                                <div className="col-lg-4">
                                  <label className="formLabel">
                                    Administrator Access
                                    <Tooltip
                                      title="Rule"
                                      arrow
                                      placement="right"
                                    >
                                      <i className="fas fa-info-circle ms-2"></i>
                                    </Tooltip>
                                  </label>
                                </div>

                                <div className="col-lg-8">
                                  <div className="row">
                                    <div className="col-lg-4">
                                      <FormControl component="fieldset">
                                        <FormControlLabel
                                          className="wp-100"
                                          control={
                                            <Checkbox
                                              name="all"
                                              onChange={this.handleSelectedAll}
                                              icon={<span className="cbx" />}
                                              checkedIcon={
                                                <span className="cbx cbx-primary" />
                                              }
                                              checked={this.state.isCheckedAll}
                                            />
                                          }
                                          label="Select all"
                                        />
                                      </FormControl>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {_modules &&
                                _.orderBy(
                                  _modules,
                                  ["sort_order"],
                                  ["asc"]
                                ).map((module) => {
                                  let _groupNameHtml = "";
                                  if (module.group_name !== _groupName) {
                                    _groupName = module.group_name;
                                    let _groupKey = "group_" + module.id;
                                    _groupNameHtml = (
                                      <label
                                        key={_groupKey}
                                        className="formLabel"
                                      >
                                        <strong
                                          style={{
                                            fontSize: "1.5rem",
                                            lineHeight: "35px",
                                            textDecoration: "underline",
                                          }}
                                        >
                                          {_groupName}
                                        </strong>
                                      </label>
                                    );
                                  }
                                  return (
                                    <>
                                      {_groupNameHtml}
                                      <div
                                        key={module.id}
                                        className="row align-items-center"
                                      >
                                        <div className="col-lg-4">
                                          <label className="formLabel">
                                            {capitalize(module.module)}
                                          </label>
                                        </div>

                                        <div className="col-lg-8">
                                          <div className="row">
                                            <div className="col-lg-3">
                                              <FormControl component="fieldset">
                                                <FormControlLabel
                                                  className="wp-100"
                                                  control={
                                                    <Checkbox
                                                      name={
                                                        "role_r_" +
                                                        module.module
                                                      }
                                                      data-name={
                                                        "role_r_" +
                                                        module.module
                                                      }
                                                      onChange={
                                                        this.handleChangeValue
                                                      }
                                                      icon={
                                                        <span className="cbx" />
                                                      }
                                                      checkedIcon={
                                                        <span className="cbx cbx-primary" />
                                                      }
                                                      checked={isCheck.includes(
                                                        "role_r_" +
                                                          module.module
                                                      )}
                                                    />
                                                  }
                                                  label="Read"
                                                />
                                              </FormControl>
                                            </div>

                                            <div className="col-lg-3">
                                              <FormControl component="fieldset">
                                                <FormControlLabel
                                                  className="wp-100"
                                                  control={
                                                    <Checkbox
                                                      name={
                                                        "role_c_" +
                                                        module.module
                                                      }
                                                      data-name={
                                                        "role_c_" +
                                                        module.module
                                                      }
                                                      onChange={
                                                        this.handleChangeValue
                                                      }
                                                      icon={
                                                        <span className="cbx" />
                                                      }
                                                      checkedIcon={
                                                        <span className="cbx cbx-primary" />
                                                      }
                                                      checked={isCheck.includes(
                                                        "role_c_" +
                                                          module.module
                                                      )}
                                                    />
                                                  }
                                                  label="Create"
                                                />
                                              </FormControl>
                                            </div>

                                            <div className="col-lg-3">
                                              <FormControl component="fieldset">
                                                <FormControlLabel
                                                  className="wp-100"
                                                  control={
                                                    <Checkbox
                                                      name={
                                                        "role_w_" +
                                                        module.module
                                                      }
                                                      data-name={
                                                        "role_w_" +
                                                        module.module
                                                      }
                                                      onChange={
                                                        this.handleChangeValue
                                                      }
                                                      icon={
                                                        <span className="cbx" />
                                                      }
                                                      checkedIcon={
                                                        <span className="cbx cbx-primary" />
                                                      }
                                                      checked={isCheck.includes(
                                                        "role_w_" +
                                                          module.module
                                                      )}
                                                    />
                                                  }
                                                  label="Edit"
                                                />
                                              </FormControl>
                                            </div>

                                            <div className="col-lg-3">
                                              <FormControl component="fieldset">
                                                <FormControlLabel
                                                  className="wp-100"
                                                  control={
                                                    <Checkbox
                                                      name={
                                                        "role_d_" +
                                                        module.module
                                                      }
                                                      data-name={
                                                        "role_d_" +
                                                        module.module
                                                      }
                                                      onChange={
                                                        this.handleChangeValue
                                                      }
                                                      icon={
                                                        <span className="cbx" />
                                                      }
                                                      checkedIcon={
                                                        <span className="cbx cbx-primary" />
                                                      }
                                                      checked={isCheck.includes(
                                                        "role_d_" +
                                                          module.module
                                                      )}
                                                    />
                                                  }
                                                  label="Delete"
                                                />
                                              </FormControl>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>

                <DialogActions>
                  <div className="d-flex justify-content-end">
                    <Button
                      className="btn btn-light btn-active-primary font-weight-bold"
                      variant="contained"
                      onClick={this.handleRoleLayout}
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
              </>
            )}
          </form>
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
    setRoleLayout: (val) => {
      dispatch(setRoleLayout(val));
    },
    handleSuccess: (msg) => {
      dispatch(handleSuccess(msg));
    },
    handleFailure: (msg) => {
      dispatch(handleFailure(msg));
    },
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(RoleLayout)
);
