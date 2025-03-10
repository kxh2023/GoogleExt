// DocumentBridge.tsx - Example of how to use DocumentSender with ShadowDom
import React, { useState } from "react";
import { ShadowDom } from "../../shadow_dom/ShadowDom";
import DocumentSender from "./DocumentSender";
import { DocumentContent } from "./DocumentReader";

// Props for the DocumentBridge component
interface DocumentBridgeProps {
  parentElement: Element;
}

/**
 * DocumentBridge component
 *
 * This component serves as a bridge between the document reader and your ShadowDom.
 * It uses DocumentSender to get document updates and passes them to components
 * rendered inside the ShadowDom.
 */
const DocumentBridge: React.FC<DocumentBridgeProps> = ({ parentElement }) => {
  // State to store the latest document content
  const [documentContent, setDocumentContent] =
    useState<DocumentContent | null>(null);

  // Handle document content updates
  const handleContentUpdate = (content: DocumentContent) => {
    setDocumentContent(content);

    // You can do additional processing here before sending to ShadowDom
    console.log("Document updated:", content.timestamp);
  };

  return (
    <>
      {/* DocumentSender doesn't render anything visible, it just handles the document reading */}
      <DocumentSender onContentUpdate={handleContentUpdate} autoUpdate={true} />

      {/* ShadowDom with content */}
      <ShadowDom parentElement={parentElement} sidebarWidth={300}>
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "16px",
            backgroundColor: "white",
            overflow: "auto",
          }}
        >
          {/* Header section */}
          <div
            style={{
              marginBottom: "16px",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px" }}>Overleaf Assistant</h2>
          </div>

          {/* Document info section */}
          {documentContent ? (
            <div>
              <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                <strong>Document Stats:</strong> {documentContent.lines.length}{" "}
                lines,
                {documentContent.rawText.length} characters
              </div>

              {/* Just sending the document data along - you mentioned you'll handle processing */}
              <pre
                style={{
                  display: "none",
                  visibility: "hidden",
                }}
                id="document-data"
                data-document={JSON.stringify({
                  rawText: documentContent.rawText,
                  timestamp: documentContent.timestamp,
                })}
              />

              {/* Preview of document (optional) */}
              <div
                style={{
                  maxHeight: "200px",
                  overflow: "auto",
                  border: "1px solid #eee",
                  borderRadius: "4px",
                  padding: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  backgroundColor: "#f9f9f9",
                }}
              >
                {documentContent.rawText.substring(0, 500)}
                {documentContent.rawText.length > 500 && "..."}
              </div>
            </div>
          ) : (
            <div>Waiting for document content...</div>
          )}

          {/* Your processing will happen here */}
          <div id="processing-container" style={{ marginTop: "16px" }}>
            {/* This is where your processing component would go */}
          </div>
        </div>
      </ShadowDom>
    </>
  );
};

export default DocumentBridge;
