"use client";

import SphereScene from "../components/SphereScene";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  getCleanedResumes,
  getUnbiasingSummary,
  uploadDataset,
  getJobStatus,
  downloadFile,
  saveFile,
  getAllClusterAnalyses,
  getAllClustersInfo,
  getUnbiasedEmbeddingsData,
  getRemovedEmbeddingsData,
} from "../api/apiClient";
import PageLogo from "../components/page_ui/PageLogo";
import ActionButtons from "../components/page_ui/ActionButtons";
import JobStatusDisplay from "../components/page_ui/JobStatusDisplay";
import UploadProgressOverlay from "../components/page_ui/UploadProgressOverlay";
import SuccessNotification from "../components/page_ui/SuccessNotification";
import UploadModal from "../components/page_ui/UploadModal";

// define interfaces for our API responses
interface Resume {
  id: number;
  Resume_str: string;
  Category?: string;
  [key: string]: any; // for any other properties
}

interface ResumesResponse {
  records: Resume[];
  total_records?: number;
  total_pages?: number;
  page?: number;
  page_size?: number;
}

interface SummaryResponse {
  summary: string;
}

interface JobStatusResponse {
  job_id: string;
  status: string;
  log?: string;
}

interface UploadResponse {
  message: string;
  job_id: string;
  rows_count: number;
  status: string;
}

// add this interface to properly type the clusters info response
interface ClustersInfoResponse {
  clusters: {
    [clusterId: string]: {
      size: number;
      center: number[];
      [key: string]: any;
    };
  };
}

// add this interface near your other interfaces
interface EmbeddingsData {
  dimensions: number;
  count: number;
  embeddings: number[][];
  file_size_bytes: number;
}

export default function Home() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [processingLog, setProcessingLog] = useState<string>("");
  const [embeddingsData, setEmbeddingsData] = useState<EmbeddingsData | null>(
    null
  );
  const [removedEmbeddingsData, setRemovedEmbeddingsData] =
    useState<EmbeddingsData | null>(null);
  const [clusterData, setClusterData] = useState<any>(null);
  const [clusterCount, setClusterCount] = useState<number>(5); // default number of clusters
  const [aggressiveness, setAggressiveness] = useState<number>(50); // default aggressiveness (0-100)
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "complete" | "error"
  >("idle");
  const [showSuccessNotification, setShowSuccessNotification] =
    useState<boolean>(false);
  const [showDefaultObjects, setShowDefaultObjects] = useState<boolean>(true);
  const [exampleDatasetName, setExampleDatasetName] = useState<string | null>(null); // added for example dataset

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resumesData = (await getCleanedResumes(1, 10)) as ResumesResponse;
        const summaryData = (await getUnbiasingSummary()) as SummaryResponse;

        // update state with the data
        if (resumesData && resumesData.records) {
          setResumes(resumesData.records);
        }

        if (summaryData && summaryData.summary) {
          setSummary(summaryData.summary);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchData();
  }, []);

  // if (resumes) {
  //   console.log(resumes);
  // }
  if (summary) {
    console.log(summary);
  }

  // poll for job status updates
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (jobId && ["processing", "running"].includes(jobStatus || "")) {
      setUploadStatus("processing");
      interval = setInterval(async () => {
        try {
          const status = (await getJobStatus(jobId)) as JobStatusResponse;
          setJobStatus(status.status);
          setProcessingLog(status.log || "");

          if (status.status === "completed") {
            setUploadStatus("complete");
            setShowSuccessNotification(true);

            // refresh data when job completes
            const resumesData = (await getCleanedResumes(
              1,
              10
            )) as ResumesResponse;
            const summaryData =
              (await getUnbiasingSummary()) as SummaryResponse;

            if (resumesData && resumesData.records) {
              setResumes(resumesData.records);
            }

            if (summaryData && summaryData.summary) {
              setSummary(summaryData.summary);
            }

            // fetch all cluster data at once
            try {
              // get all cluster analyses in one call
              const clusterAnalyses = await getAllClusterAnalyses();
              console.log("Retrieved all cluster analyses:", clusterAnalyses);

              // get full clusters info in one call
              const clustersInfo =
                (await getAllClustersInfo()) as ClustersInfoResponse;
              console.log("Retrieved complete clusters info:", clustersInfo);

              if (
                clustersInfo &&
                typeof clustersInfo === "object" &&
                "clusters" in clustersInfo
              ) {
                // log the number of clusters found
                const clusterIds = Object.keys(clustersInfo.clusters);
                console.log(`Found ${clusterIds.length} clusters in total`);

                // we now have all cluster data at once - no need for individual fetches
                console.log("All cluster data successfully retrieved in bulk");
              }
            } catch (error) {
              console.error("Error fetching cluster data:", error);
            }

            setIsLoading(false);

            // clear job ID after successful completion - reduced from 3000ms to 2000ms
            setTimeout(() => {
              setJobId(null);
              setJobStatus(null);
            }, 2000);

            // clear the success message after animation completes - reduced from 3500ms to 2000ms
            setTimeout(() => {
              setUploadStatus("idle");
              setShowSuccessNotification(false);
            }, 2000);
          } else if (status.status === "failed") {
            setUploadStatus("error");
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error checking job status:", error);
          setUploadStatus("error");
        }
      }, 2000); // check every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, jobStatus]);

  const handleUpload = async () => {
    setShowUploadModal(true);
  };

  const handleFilter = async () => {
    setIsLoading(true);
    try {
      // for now, we're just downloading the unbiased dataset
      const blob = await downloadFile("unbiased_resumes");
      if (blob) {
        saveFile(blob, "unbiased_resumes.csv");
      }
    } catch (error) {
      console.error("Error filtering files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // download the summary text
      const blob = await downloadFile("summary");
      if (blob) {
        saveFile(blob, "unbiasing_summary.txt");
      }
    } catch (error) {
      console.error("Error downloading files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        return;
      }
      setUploadedFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUseExampleDataset = async () => {
    try {
      setIsLoading(true); // show some loading indication
      const response = await fetch("/data/example_resume_dataset.csv");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch example dataset: ${response.statusText}`
        );
      }
      const blob = await response.blob();
      const exampleFile = new File([blob], "example_resume_dataset.csv", {
        type: "text/csv",
      });
      setUploadedFile(exampleFile);
      setExampleDatasetName(exampleFile.name); // store the name of the example dataset
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading example dataset:", error);
      alert("Could not load the example dataset. Make sure 'public/data/example_resume_dataset.csv' exists.");
      setIsLoading(false);
    }
  };

  const processUpload = async () => {
    if (!uploadedFile) {
      return;
    }

    setIsLoading(true);
    setShowUploadModal(false);
    setUploadStatus("uploading");

    // simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 300);

    try {
      // upload the file to the backend with cluster count
      const response = (await uploadDataset(
        uploadedFile,
        clusterCount
      )) as UploadResponse;

      if (response && response.job_id) {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setJobId(response.job_id);
        setJobStatus("processing");
        setUploadStatus("processing");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      clearInterval(progressInterval);
      setUploadStatus("error");
      console.error("Error processing file:", error);
    }
  };

  const handleFetchAndLogEmbeddings = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching unbiased embeddings data...");
      const data = (await getUnbiasedEmbeddingsData()) as EmbeddingsData;

      // log the entire embeddings data to console
      console.log("Unbiased embeddings data:", data);
      console.log("Number of embeddings:", data.count);
      console.log("Embedding dimensions:", data.dimensions);
      console.log("First embedding:", data.embeddings[0]);

      alert(
        `Successfully fetched ${data.count} embeddings. Check the console.`
      );
    } catch (error) {
      console.error("Error fetching embeddings:", error);
      alert("Error fetching embeddings data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchEmbeddingsInfo = async () => {
    setIsLoading(true);
    setShowDefaultObjects(false);

    try {
      // get unbiased embeddings
      const unbiasedEmbeddings =
        (await getUnbiasedEmbeddingsData()) as EmbeddingsData;
      console.log("Unbiased embeddings:", unbiasedEmbeddings);

      // get removed embeddings
      const removedEmbeddings =
        (await getRemovedEmbeddingsData()) as EmbeddingsData;
      console.log("Removed embeddings:", removedEmbeddings);

      // get all cluster analyses in one call
      const clusterAnalyses = await getAllClusterAnalyses();
      console.log("Retrieved all cluster analyses:", clusterAnalyses);

      // get full clusters info in one call
      const clustersInfo = (await getAllClustersInfo()) as ClustersInfoResponse;
      console.log("Retrieved complete clusters info:", clustersInfo);

      // update state with fetched data
      setEmbeddingsData(unbiasedEmbeddings);
      setRemovedEmbeddingsData(removedEmbeddings);
      setClusterData(clustersInfo);

      setIsLoading(false);

      // remove this alert or replace with a more subtle indication
      // alert("Successfully fetched embeddings and clusters data. Check the console.");

      // optional: You can update a state variable to show a status in the UI instead
      // setFetchStatus('success');
    } catch (error) {
      console.error("Error fetching embeddings info:", error);
      setIsLoading(false);

      // remove this alert
      // alert("Error fetching embeddings info. Please try again.");
    }
  };

  const handleClusterCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value);
    console.log(`Cluster count changed to: ${newCount}`);
    setClusterCount(newCount);
  };

  const handleAggressivenessChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAggressiveness(parseInt(e.target.value));
  };

  // update the CSS animation duration in globals.css or add this style tag to your layout.tsx
  useEffect(() => {
    // add a style tag to the document head
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      @keyframes fadeOut {
        0% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
      }
      .animate-fadeOut {
        animation: fadeOut 2s forwards;
      }
    `;
    document.head.appendChild(styleTag);

    // clean up
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // add this function to filter clusters based on the slider value
  const getFilteredClusterData = useCallback(() => {
    if (!clusterData || !clusterData.clusters) return null;
    
    // get all cluster IDs
    const allClusterIds = Object.keys(clusterData.clusters);
    
    // sort clusters by size (optional, depends on how you want to prioritize)
    const sortedClusterIds = allClusterIds.sort((a, b) => 
      clusterData.clusters[b].size - clusterData.clusters[a].size
    );
    
    // take only the first n clusters based on slider
    const selectedClusterIds = sortedClusterIds.slice(0, clusterCount);
    
    // create a filtered version of the cluster data
    const filteredClusters: {[key: string]: any} = {};
    selectedClusterIds.forEach(id => {
      filteredClusters[id] = clusterData.clusters[id];
    });
    
    return {
      ...clusterData,
      clusters: filteredClusters
    };
  }, [clusterData, clusterCount]);

  // use the filtered data when passing to SphereScene
  useEffect(() => {
    // this effect runs when clusterCount or clusterData changes
    console.log(`Updating visible clusters to show ${clusterCount} clusters`);
  }, [clusterCount, clusterData]);

  const fetchEmbeddings = async () => {
    setIsLoading(true);
    try {
      // fetch unbiased embeddings
      const unbiasedData = await getUnbiasedEmbeddingsData() as EmbeddingsData;
      setEmbeddingsData(unbiasedData);
      
      // fetch removed embeddings
      const removedData = await getRemovedEmbeddingsData() as EmbeddingsData;
      setRemovedEmbeddingsData(removedData);
      
      // fetch cluster data
      const clustersInfo = await getAllClustersInfo();
      setClusterData(clustersInfo);
      
      // only hide default objects after embeddings are fetched
      setShowDefaultObjects(false);
    } catch (error) {
      console.error("Error fetching embeddings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      {/* main content area - SphereScene is now effectively always rendered */}
      <div className="w-full h-screen">
        {/* simplified: SphereScene is rendered if activeTab is clusters (which it always should be) */}
        <SphereScene
          clusterData={getFilteredClusterData()}
          unbiasedEmbeddings={embeddingsData}
          removedEmbeddings={removedEmbeddingsData}
          clusterEmbeddings={getFilteredClusterData()} // this prop might need review based on SphereScene's needs
          clusterCount={clusterCount}
          showDefaultObjects={showDefaultObjects}
        />
      </div>

      {/* logo at top left with good padding - persistent across all tabs */}
      <PageLogo />

      {/* action buttons - vertical on right side */}
      <ActionButtons 
        handleUpload={handleUpload}
        handleFilter={handleFilter}
        handleDownload={handleDownload}
        fetchEmbeddings={fetchEmbeddings}
      />

      {/* status display if there's an active job */}
      <JobStatusDisplay 
        jobId={jobId} 
        jobStatus={jobStatus} 
        processingLog={processingLog} 
      />

      {/* new Upload Progress Overlay */}
      <UploadProgressOverlay 
        uploadStatus={uploadStatus}
        uploadedFile={uploadedFile}
        uploadProgress={uploadProgress}
        setUploadStatus={setUploadStatus}
      />

      {/* success notification at bottom right of screen, above instructions box */}
      <SuccessNotification showSuccessNotification={showSuccessNotification} />

      {/* upload Modal with Backdrop Blur */}
      <UploadModal 
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        uploadedFile={uploadedFile}
        setUploadedFile={setUploadedFile}
        handleFileChange={handleFileChange}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        triggerFileInput={triggerFileInput}
        fileInputRef={fileInputRef}
        handleUseExampleDataset={handleUseExampleDataset}
        exampleDatasetName={exampleDatasetName}
        clusterCount={clusterCount}
        handleClusterCountChange={handleClusterCountChange}
        aggressiveness={aggressiveness}
        handleAggressivenessChange={handleAggressivenessChange}
        processUpload={processUpload}
        isLoading={isLoading}
      />
    </main>
  );
}
