"use strict";

/* Package System */
import React from "react";
import Link from "next/link";

/* Package Application */
import FormLayout from "@views/Admin/Components/FormLayout";

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
          getData={{ specialty_id: "specialties?limit=10000&fqnull=deleted_at", clinic_id: "clinics?limit=10000&fqnull=deleted_at"}}
          fields={[
            {
              key: "name",
              label: "Họ và tên",
              type: "text",
              col: "left",
              isRequied: true,
            },
            {
              key: "avatar",
              label: "Ảnh",
              type: "image",
              cdn: process.env.API_URL + "/",
              col: "left",
              isRequied: true,
            }, 
            {
              key: "specialty_id",
              label: "Khoa",
              type: "select",
              defaultValue: true,
              col: "left",
            },
            {
              key: "province",
              label: "Địa chỉ",
              type: "text",
              col: "left",
              isRequied: true,
            },
            {
              key: "clinic_id",
              label: "Nhãn",
              type: "select",
              defaultValue: true,
              col: "left",
            },
            {
              key: "status",
              label: "Trạng thái",
              type: "status",
              defaultValue: true,
              col: "right",
            },
          ]}
        />
      </>
    );
  }
}

export default Form;
