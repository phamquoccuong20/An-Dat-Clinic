"use strict";

/* Package System */
import React from "react";

/* Package Application */
import ListLayout from "@views/Admin/Components/ListLayout";

class List extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    return (
      <React.Fragment>
        {/*  
					maxWidthPopup: xl,lg,md,sm,xs
					isBtnAdd={true} -- Nút thêm
					search={true} -- tìm kiếm
					export={true} -- xuất dữ liệu
					isBtnFilter={true} -- bộ lọc
					hideAction={true} -- List ẩn hành động
					data -- các trường trong update/add
				*/}
        <ListLayout
          nameDisplay={"Quản lý danh mục"}
          isBtnAdd={true}
          search={true}
          search_fields = {"name"}
          maxWidthPopup="lg"
          isBtnFilter={true}
          columns={[
            { key: "name", label: "Tên danh mục", type: "text" },
            { key: "parent_id", label: "Số danh mục", type: "number" },
            { key: "status", label: "Trạng thái", type: "status", width: 120 },
            {
              key: "created_at",
              label: "Ngày tạo",
              type: "dateTime",
              width: 120,
            },
          ]}
        />
      </React.Fragment>
    );
  }
}

export default List;
