"use strict";

/* Package System */
import React from "react";
import Link from "next/link";

/* Package Application */
import RoleLayout from "@views/Admin/Components/RoleLayout";

/* Package style */

class Role extends React.Component {
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
        <RoleLayout
          tabPlatform={true}
          tabPlatformActive={"info"}
          tabPlatformData={[
            { key: "info", name: "Thông tin" },
            { key: "system", name: "Thiết lập" },
          ]}
          getData={{ permission: "modules?limit=10000" }}
          fields={[
            {
              key: "permissions",
              label: "Module",
              type: "text",
              col: "left",
              isRequied: true,
              tabKey: "info",
            },
            {
              key: "name",
              label: "Tên module",
              type: "text",
              col: "left",
              isRequied: true,
              tabKey: "info",
            },
            {
              key: "addMore",
              type: "addMore",
              col: "left",
              targetField: "fields",
              tabKey: "system",
            },
          ]}
        />
      </>
    );
  }
}

export default Role;
