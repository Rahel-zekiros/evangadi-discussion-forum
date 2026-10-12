
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import {
  WandSparkles,
  ScanSearch,
  BadgeCheck,
  CopyCheck,
  MessageCircle,
  RefreshCw,
  FileDown,
  DatabaseZap,
  ChartNoAxesCombined,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  CircleX,
} from "lucide-react";

import { apiClient } from "../../services/core/api.client.js";
import styles from "./knowledgeBase.module.css";

export default function RagFeaturesSection({
  selectedDoc,
  textContent,
  isLoadingText,
  searchQuery,
  setSearchQuery,
  searchResults = [],
  isSearching,
  searchError,
  searchMessage,
  selectedResult,
  setSelectedResult,
  expandedChunks = {},
  setExpandedChunks,
  handleSelectResult,
  toggleChunkExpand,
  handleSemanticSearch,
  chatMessages = [],
  aiQuestion,
  setAiQuestion,
  isAskingAI,
  aiError,
  copiedIndex,
  handleAskAI,
  handleCopyAnswer,
  handleResetChat,
  handleExportChat,
  chatEndRef,
}) {
  // Active tab
  const [activeTab, setActiveTab] = useState("search");

  // PDF reader state
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Support both documentId and document_id
  const documentId =
    selectedDoc?.documentId ?? selectedDoc?.document_id;

  const isTxtFile = selectedDoc?.title
    ?.toLowerCase()
    .endsWith(".txt");

  // Load PDF through the authenticated API client
  useEffect(() => {
    let cancelled = false;
    let objectUrl;

    const loadPdf = async () => {
      if (!selectedDoc || isTxtFile || !documentId) {
        setPdfUrl("");
        setPdfError("");
        setPdfLoading(false);
        return;
      }

      try {
        setPdfLoading(true);
        setPdfError("");
        setPdfUrl("");

        const response = await apiClient.get(
          `/api/rag/documents/${documentId}/file`,
          {
            responseType: "blob",
            skipAutoRedirect: true,
          },
        );

        if (cancelled) return;

        const contentType =
          response.headers["content-type"] || "";

        if (!contentType.includes("application/pdf")) {
          throw new Error(
            `Expected PDF but received: ${contentType || "unknown content type"}`,
          );
        }

        objectUrl = URL.createObjectURL(response.data);

        setPdfUrl(objectUrl);
      } catch (error) {
        if (cancelled) return;

        console.error("PDF loading error:", error);

        setPdfError(
          error.response?.status === 401
            ? "Session expired. Please log in again."
            : error.response?.status === 404
              ? "Document not found or you do not have access to it."
              : "Unable to load the PDF. Check authentication and the file path.",
        );
      } finally {
        if (!cancelled) {
          setPdfLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
}, [documentId, selectedDoc, isTxtFile]);
  // Markdown renderer
  const renderMarkdown = (content) => (
    <div className={styles.markdownContent}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {content || "No text available for this chunk."}
      </ReactMarkdown>
    </div>
  );

  return (
    <>
      {/* READER SECTION */}
      {selectedDoc ? (
        <div className={styles.activeReaderContainer}>
          <div className={styles.readerSection}>
            <div className={styles.readerHeader}>
              <div>
                <h3 className={styles.sectionTitle}>
                  Reader ({selectedDoc.title})
                </h3>

                <p className={styles.sectionSubtitle}>
                  Interactive Viewer
                </p>
              </div>
            </div>

            <div className={styles.pdfViewerContainer}>
              {isTxtFile ? (
                isLoadingText ? (
                  <div className={styles.txtLoading}>
                    Loading document...
                  </div>
                ) : textContent ? (
                  <pre className={styles.txtReader}>
                    {textContent}
                  </pre>
                ) : (
                  <div className={styles.txtLoading}>
                    No text content found.
                  </div>
                )
              ) : pdfLoading ? (
                <div className={styles.txtLoading}>
                  Loading PDF...
                </div>
              ) : pdfError ? (
                <div className={styles.searchErrorBanner}>
                  {pdfError}
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title={selectedDoc.title}
                  className={styles.pdfIframe}
                />
              ) : (
                <div className={styles.txtLoading}>
                  PDF preview is unavailable.
                </div>
              )}
            </div>
          </div>

          <div className={styles.sectionDivider} />
        </div>
      ) : (
        <div className={styles.allDocumentsModeBanner}>
          <WandSparkles
            size={16}
            className={styles.allDocumentsModeIcon}
          />

          <span>
            <strong>All Documents Mode Active:</strong>{" "}
            You are currently searching and chatting across
            your entire library collection.
          </span>
        </div>
      )}

      {/* TABS */}
      <div className={styles.tabContainer}>
        <div className={styles.tabHeader}>
          <button
            type="button"
            className={
              activeTab === "search"
                ? `${styles.tabButton} ${styles.activeTab}`
                : styles.tabButton
            }
            onClick={() => setActiveTab("search")}
          >
            <ScanSearch size={16} />
            <span>Semantic Search</span>

            {searchResults.length > 0 && (
              <span className={styles.tabBadge}>
                {searchResults.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={
              activeTab === "chat"
                ? `${styles.tabButton} ${styles.activeTab}`
                : styles.tabButton
            }
            onClick={() => setActiveTab("chat")}
          >
            <MessageCircle size={16} />
            <span>Interactive AI Chat</span>

            {chatMessages.length > 0 && (
              <span className={styles.tabBadge}>
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>

        <div className={styles.tabBody}>
          {/* SEMANTIC SEARCH */}
          {activeTab === "search" && (
            <div className={styles.featureSection}>
              <h3 className={styles.sectionTitle}>
                Semantic search
              </h3>

              <p className={styles.sectionSubtitle}>
                Find passages by contextual meaning.
              </p>

              <div className={styles.searchRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Search query
                  </label>

                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Enter keywords or concepts..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !isSearching &&
                        searchQuery.trim()
                      ) {
                        handleSemanticSearch();
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  className={styles.actionOrangeBtn}
                  onClick={handleSemanticSearch}
                  disabled={
                    isSearching || !searchQuery.trim()
                  }
                >
                  <ScanSearch size={14} />
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {searchError && (
                <div className={styles.searchErrorBanner}>
                  {searchError}
                </div>
              )}

              {searchMessage && (
                <div className={styles.searchMessageBanner}>
                  <span>
                    <TriangleAlert size={18} />
                  </span>
                  <span>{searchMessage}</span>
                </div>
              )}

              {/* SEARCH RESULTS */}
              {searchResults.length > 0 && (
                <div className={styles.searchResultsContainer}>
                  <div className={styles.searchResultsHeader}>
                    <div className={styles.searchResultsTitle}>
                      <ChartNoAxesCombined
                        size={16}
                        className={styles.blueIcon}
                      />
                      <strong>Search Results</strong>
                    </div>

                    <span className={styles.resultCount}>
                      {searchResults.length} result
                      {searchResults.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {searchResults.map((result, index) => {
                    const chunkIdx =
                      result.chunkIndex ?? index;

                    const resultDocumentId =
                      result.documentId ??
                      result.document_id ??
                      documentId ??
                      "doc";

                    const chunkKey =
                      `${resultDocumentId}-${chunkIdx}`;

                    const isSelected =
                      selectedResult?.chunkId === result.chunkId ||
                      selectedResult === result;

                    const isExpanded =
                      expandedChunks[chunkKey] ?? true;

                    return (
                      <div
                        key={result.chunkId ?? chunkKey}
                        className={
                          isSelected
                            ? styles.searchResultCardSelected
                            : styles.searchResultCard
                        }
                      >
                        <div
                          className={styles.resultHeader}
                          onClick={(e) => {
                            handleSelectResult(result);
                            toggleChunkExpand(chunkKey, e);
                          }}
                        >
                          <span className={styles.resultChunkTitle}>
                            Result {index + 1}

                            {result.pageStart != null && (
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  opacity: 0.8,
                                  marginLeft: "8px",
                                }}
                              >
                                (Page {result.pageStart}
                                {result.pageEnd != null &&
                                result.pageEnd !== result.pageStart
                                  ? ` - ${result.pageEnd}`
                                  : ""}
                                )
                              </span>
                            )}
                          </span>

                          <div className={styles.chatHeaderButtons}>
                            <span
                              className={
                                isSelected
                                  ? styles.resultSelectedText
                                  : styles.resultInspectText
                              }
                            >
                              {isSelected
                                ? "Selected"
                                : "Click to inspect"}
                            </span>

                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className={styles.searchResultContent}>
                            {renderMarkdown(result.content)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SELECTED RESULT */}
              {selectedResult && (
                <div className={styles.selectedResultPanel}>
                  <div className={styles.selectedResultHeader}>
                    <div className={styles.selectedResultTitleArea}>
                      <DatabaseZap
                        size={19}
                        className={styles.blueIcon}
                      />

                      <div>
                        <h3 className={styles.selectedResultTitle}>
                          Selected Search Result
                        </h3>

                        <p className={styles.selectedResultSubtitle}>
                          Detailed semantic search information
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedResult(null)}
                      className={styles.closeButton}
                    >
                      <CircleX size={13} />
                      Close
                    </button>
                  </div>

                  <div className={styles.documentInformation}>
                    <strong>Document:</strong>{" "}
                    {selectedDoc?.title || "All Documents"}
                  </div>

                  <div>
                    <h4 className={styles.contentTitle}>
                      Retrieved Content
                    </h4>

                    <div className={styles.retrievedContent}>
                      {renderMarkdown(selectedResult.content)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INTERACTIVE AI CHAT */}
          {activeTab === "chat" && (
            <div className={styles.featureSection}>
              <div className={styles.chatHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>
                    Interactive AI Chat
                  </h3>

                  <p className={styles.sectionSubtitle}>
                    Ask follow-up questions with answers
                    grounded in your library.
                  </p>
                </div>

                <div className={styles.chatHeaderButtons}>
                  {chatMessages.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleExportChat}
                        className={styles.exportButton}
                        title="Export Chat as Markdown"
                      >
                        <FileDown size={12} />
                        Export
                      </button>

                      <button
                        type="button"
                        onClick={handleResetChat}
                        className={styles.clearButton}
                      >
                        <RefreshCw size={12} />
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* CHAT HISTORY */}
              {chatMessages.length > 0 && (
                <div className={styles.chatHistory}>
                  {chatMessages.map((msg, index) => (
                    <div
                      key={`${msg.role}-${index}`}
                      className={
                        msg.role === "user"
                          ? styles.userChatMessage
                          : styles.assistantChatMessage
                      }
                    >
                      <div className={styles.chatMessageHeader}>
                        <span
                          className={
                            msg.role === "user"
                              ? styles.userMessageLabel
                              : styles.assistantMessageLabel
                          }
                        >
                          {msg.role === "user"
                            ? "You"
                            : "AI Assistant Response"}
                        </span>

                        {msg.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyAnswer(msg.content, index)
                            }
                            className={
                              copiedIndex === index
                                ? styles.copyButtonCopied
                                : styles.copyButton
                            }
                          >
                            {copiedIndex === index ? (
                              <>
                                <BadgeCheck size={13} />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <CopyCheck size={13} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className={styles.chatMarkdownContent}>
                        {renderMarkdown(msg.content)}
                      </div>

                      {/* SOURCE REFERENCES */}
                      {msg.sources?.length > 0 && (
                        <div className={styles.sourcesContainer}>
                          <strong>Source references: </strong>

                          {msg.sources.map((source, sIdx) => (
                            <span
                              key={source.chunkId ?? sIdx}
                              onClick={() => {
                                setActiveTab("search");

                                const matchingResult =
                                  searchResults.find(
                                    (result) =>
                                      result.chunkId === source.chunkId,
                                  );

                                if (matchingResult) {
                                  setSelectedResult(matchingResult);

                                  const matchingDocumentId =
                                    matchingResult.documentId ??
                                    matchingResult.document_id ??
                                    documentId ??
                                    "doc";

                                  const matchingChunkIndex =
                                    matchingResult.chunkIndex ??
                                    source.chunkIndex ??
                                    sIdx;

                                  const matchKey =
                                    `${matchingDocumentId}-${matchingChunkIndex}`;

                                  setExpandedChunks((prev) => ({
                                    ...prev,
                                    [matchKey]: true,
                                  }));
                                }
                              }}
                              className={styles.sourceLink}
                              title="Click to inspect source"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" ||
                                  e.key === " "
                                ) {
                                  e.preventDefault();

                                  const matchingResult =
                                    searchResults.find(
                                      (result) =>
                                        result.chunkId === source.chunkId,
                                    );

                                  if (matchingResult) {
                                    setActiveTab("search");
                                    setSelectedResult(matchingResult);
                                  }
                                }
                              }}
                            >
                              [{sIdx + 1}]
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div ref={chatEndRef} />
                </div>
              )}

              {/* QUESTION INPUT */}
              <form
                onSubmit={handleAskAI}
                className={styles.aiQuestionForm}
              >
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    Follow-up or Question
                  </label>

                  <textarea
                    rows={3}
                    className={styles.textareaInput}
                    placeholder="Ask a question or request a follow-up across your library..."
                    value={aiQuestion}
                    onChange={(e) =>
                      setAiQuestion(e.target.value)
                    }
                  />
                </div>

                <button
                  type="submit"
                  className={styles.actionOrangeBtn}
                  disabled={
                    isAskingAI || !aiQuestion.trim()
                  }
                >
                  {isAskingAI ? (
                    <WandSparkles
                      size={14}
                      className={styles.spin}
                    />
                  ) : (
                    <MessageCircle size={14} />
                  )}

                  {isAskingAI
                    ? "Thinking & Streaming..."
                    : "Ask AI"}
                </button>
              </form>

              {aiError && (
                <div className={styles.errorBanner}>
                  {aiError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
