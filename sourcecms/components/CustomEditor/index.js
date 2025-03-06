import React from "react";
import draftToHtml from "draftjs-to-html";
// import { Editor } from "react-draft-wysiwyg";
import {
  EditorState,
  ContentState,
  convertFromHTML,
  RichUtils,
} from "draft-js";
import { connect } from "react-redux";
import dynamic from "next/dynamic";

import { customContentStateConverter } from "@utils/Helper";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const Editor = dynamic(
  () => import("react-draft-wysiwyg").then((mod) => mod.Editor),
  { ssr: false }
);
class CustomEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      contentState: "",
    };
  }

  componentDidMount() {
    this._isMounted = true;
    if (this.props?.value) {
      const blocksFromHTML = convertFromHTML(this.props?.value);
      this.setState({
        editorState: EditorState.createWithContent(
          customContentStateConverter(
            ContentState.createFromBlockArray(
              blocksFromHTML.contentBlocks,
              blocksFromHTML.entityMap
            )
          )
        ),
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.value !== prevProps.value) {
      if (this.props?.value) {
        const blocksFromHTML = convertFromHTML(this.props?.value);
        this.setState({
          editorState: EditorState.createWithContent(
            customContentStateConverter(
              ContentState.createFromBlockArray(
                blocksFromHTML.contentBlocks,
                blocksFromHTML.entityMap
              )
            )
          ),
        });
      }
    }
  }

  async uploadImageCallBack(file) {
    return new Promise((resolve, reject) => {
      let _reader = new FileReader();
      _reader.onload = async (file) => {
        let _img = file.target.result;
        resolve({
          data: {
            link: _img,
          },
        });
      };
      _reader.readAsDataURL(file);
    });
  }

  handleContentStateChange = (contentState) => {
    this.setState({ contentState: draftToHtml(contentState) });
  };
  handleEditorStateChange = (editorState) => {
    this.setState({ editorState: editorState });
  };
  render() {
    const { key } = this.props?.field;
    return (
      <React.Fragment>
        <div id="editor-wrapper">
          <Editor
            editorState={this.state.editorState}
            toolbarClassName="editor-toolbar"
            wrapperClassName="editor-wrapper"
            editorClassName="editor"
            toolbar={{
              options: [
                "inline",
                "blockType",
                "fontSize",
                "list",
                "history",
                "image",
                "colorPicker",
                "textAlign",
              ],
              image: {
                previewImage: true,
                urlEnabled: true,
                uploadEnabled: true,
                crossorigin: "anonymous",
                uploadCallback: this.uploadImageCallBack,
                inputAccept:
                  "image/gif,image/jpeg,image/jpg,image/png,image/svg,image/webp",
              },
              textAlign: { inDropdown: true },
              link: { inDropdown: true },
            }}
            onEditorStateChange={this.handleEditorStateChange}
            onContentStateChange={this.handleContentStateChange}
            handleKeyCommand={(command) => {
              const newState = RichUtils.handleKeyCommand(
                this.state.editorState,
                command
              );

              if (newState) {
                this.handleEditorStateChange(newState);
                return "handled";
              }

              return "not-handled";
            }}
          />
          <input
            value={
              this.state?.contentState
                ? this.state?.contentState
                : this.props?.value
            }
            name={key}
            hidden
            readOnly
          />
          {/* <div dangerouslySetInnerHTML={{ __html: val[column.key] }} className="content-wrapper--ins"/> */}
        </div>
        <style jsx global>
          {`
            #editor-wrapper {
              border: 1px solid;
              padding: 14px;
              min-height: 400px;
              border-color: var(--color-secondary-background);
              border-radius: 8px;
              width: 100%;
              position: relative;
              .rdw-editor-main {
                min-height: 100px;
                color: var(--joy-palette-gray-900);
                overflow: hidden !important;
              }
              .rdw-image-imagewrapper {
                img {
                  position: relative !important;
                }
              }
              .editor-toolbar {
                position: sticky;
                z-index: 9;
                background: #ffffff;
                top: 0;
              }
            }
          `}
        </style>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    stateAccount: state.account,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    refreshToken: (params) => {
      dispatch(refreshToken(params));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomEditor);
