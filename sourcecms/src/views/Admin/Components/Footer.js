"use strict";

/* Package System */
import React from "react";

/* Package Application */


/* Package style */
import styles from '@public/scss/admin/layouts/Footer.module.scss'

class Footer extends React.Component{

	constructor(props){
		super(props);
	}

	render(){
		return(
			<>
				<div id={styles.footer}>
					<div className="container-fluid d-flex align-items-center">
						<div className={styles.footerCopyright}>
							2023© <a href="https://mcv.com.vn/en/" className="tt-link">MCV Group</a> All rights reserved.
						</div>
						<div className="f-right">Powered by NetDev</div>
					</div>
				</div>
			</>
		)
	}
}

export default Footer;