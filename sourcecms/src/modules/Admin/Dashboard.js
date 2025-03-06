"use strict";

/* Package System */
import React from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

/* Package Application */
//const Chart = dynamic(()=>import('react-apexcharts'),{ssr:false});
import { Stack } from "@mui/material";
import DetailLayout from "@views/Admin/Components/DetailLayout";

/* Package style */
import images from "@public/images/images.png";
import ytb from "@public/images/ytb-logo.png";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {};
  }

  render() {
    return <>...</>;
  }
}

export default Dashboard;
