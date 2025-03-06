"use strict";

/* Package System */
import React from "react";
import Link from "next/link";

/* Package Application */
import FormLayout from "@views/Admin/Components/FormLayout";
import { withRouter } from "next/router";
import { connect } from "react-redux";

/* Package style */

class Form extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        {/* TYPE : text,status,radio,select,select_multi,image,video,textarea,autoComplete (multiple:true),password,dateTime
					col:'left', col:'right'
					hideColRight={true} -- ẩn cột phải
				*/}
        <FormLayout
          getData={{
            tracker_log: `logs?limit=10000&fq=module:${this.props.stateStatus.formLayout?.module_filter},
                          item_id:${this.props.stateStatus.formLayout?.item_id}`,
          }}
          fields={[
            { key: "module", label: "Module", type: "text", col: "left", readOnly: true },
            { key: "type", label: "Type", type: "text", col: "left", readOnly: true },
            { key: "detail", label: "Detail", type: "textarea", col: "left", readOnly: true },
            { key: "tracker_log", label: "", type: "timelinelog", defaultValue: true, col: "right" },
          ]}
        />
      </>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    stateStatus: state.status,
  };
};

export default withRouter(connect(mapStateToProps)(Form));
