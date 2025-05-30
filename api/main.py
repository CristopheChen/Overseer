import os
import logging
import pandas as pd
from pathlib import Path
import time
import sys
import argparse
import shutil

# import functions from our other files
from embeddings import main as embeddings_main
from cluster_analysis import main as cluster_analysis_main
from create_unbiased_dataset import create_unbiased_dataset

# setup argument parser
def parse_args():
    # parse command-line arguments
    parser = argparse.ArgumentParser(description='Process resume data')
    parser.add_argument('--input', type=str, help='Path to input CSV file')
    parser.add_argument('--job_id', type=str, help='Job ID for this processing run')
    parser.add_argument('--cluster_count', type=int, default=6, help='Number of clusters to create (1-10)')
    
    return parser.parse_args()

# setup logging
def setup_logging(job_id=None):
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    
    if job_id:
        # use job_id for the log filename
        log_file = log_dir / f"unbiasing_pipeline_{job_id}.log"
        # also create a symbolic link to the job directory
        job_dir = Path("uploads") / job_id
        job_log_file = job_dir / "pipeline.log"
    else:
        log_file = log_dir / f"unbiasing_pipeline_{timestamp}.log"
    
    # configure logging to write to both file and console
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logging.info(f"Starting unbiasing pipeline. Logs will be saved to {log_file}")
    return log_file

def count_files_in_dir(directory):
    # count files in a directory and report their sizes
    if not os.path.exists(directory):
        return "Directory does not exist"
    
    result = []
    total_size_mb = 0
    
    for file in os.listdir(directory):
        file_path = os.path.join(directory, file)
        if os.path.isfile(file_path):
            size_mb = os.path.getsize(file_path) / (1024 * 1024)
            total_size_mb += size_mb
            result.append(f"{file} ({size_mb:.2f} MB)")
    
    return f"{len(result)} files, total size: {total_size_mb:.2f} MB\n" + "\n".join(result)

def report_file_info(file_path):
    # report information about a file
    if not os.path.exists(file_path):
        return f"{file_path} does not exist"
    
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    
    if file_path.endswith('.csv'):
        try:
            df = pd.read_csv(file_path)
            return f"{file_path}: {len(df)} rows, {len(df.columns)} columns, {size_mb:.2f} MB"
        except Exception as e:
            return f"{file_path}: {size_mb:.2f} MB (Error reading CSV: {e})"
    else:
        return f"{file_path}: {size_mb:.2f} MB"

def main():
    # main function to execute the entire unbiasing pipeline
    # parse command-line arguments
    args = parse_args()
    
    # ensure cluster count is within valid range
    cluster_count = max(1, min(10, args.cluster_count))
    
    # setup logging
    log_file = setup_logging(args.job_id)
    
    try:
        # set the input file path
        input_file = args.input
        job_id = args.job_id
        
        if input_file:
            logging.info(f"Using custom input file: {input_file}")
        else:
            logging.info("No input file specified, will use default dataset")
        
        # create job completion marker if job_id is provided
        job_dir = None
        if job_id:
            job_dir = Path("uploads") / job_id
            
        # step 1: Generate embeddings and find clusters
        logging.info("=" * 80)
        logging.info("STEP 1: GENERATING EMBEDDINGS AND FINDING CLUSTERS")
        logging.info("=" * 80)
        
        df, embeddings = embeddings_main(input_file, cluster_count)
        
        if df is None or embeddings is None:
            logging.error("Failed to generate embeddings. Exiting.")
            if job_dir:
                (job_dir / "failed").touch()
            return
        
        logging.info(f"Embeddings shape: {embeddings.shape}")
        logging.info(f"Generated cleaned_resumes.csv: {report_file_info('cleaned_resumes.csv')}")
        logging.info(f"Generated resume_embeddings.npy: {report_file_info('resume_embeddings.npy')}")
        
        # report on clusters
        clusters_dir = Path("clusters")
        if clusters_dir.exists():
            logging.info(f"Clusters directory contents:\n{count_files_in_dir('clusters')}")
        
        # step 2: Analyze clusters using Cohere
        logging.info("\n" + "=" * 80)
        logging.info("STEP 2: ANALYZING CLUSTERS USING COHERE")
        logging.info("=" * 80)
        
        cluster_analysis_main()
        
        # report on analysis results
        analysis_dir = Path("cluster_analysis")
        if analysis_dir.exists():
            logging.info(f"Cluster analysis directory contents:\n{count_files_in_dir('cluster_analysis')}")
        
        # step 3: Create unbiased dataset
        logging.info("\n" + "=" * 80)
        logging.info("STEP 3: CREATING UNBIASED DATASET")
        logging.info("=" * 80)
        
        unbiased_df, removed_df = create_unbiased_dataset()
        
        # report on unbiased dataset
        unbiased_dir = Path("unbiased_dataset")
        if unbiased_dir.exists():
            logging.info(f"Unbiased dataset directory contents:\n{count_files_in_dir('unbiased_dataset')}")
        
        # final summary
        logging.info("\n" + "=" * 80)
        logging.info("PIPELINE COMPLETE - SUMMARY")
        logging.info("=" * 80)
        
        logging.info(f"Original dataset: {report_file_info('cleaned_resumes.csv')}")
        logging.info(f"Unbiased dataset: {report_file_info('unbiased_dataset/unbiased_resumes.csv')}")
        logging.info(f"Removed entries: {report_file_info('unbiased_dataset/removed_entries.csv')}")
        
        if os.path.exists('unbiased_dataset/unbiasing_summary.txt'):
            with open('unbiased_dataset/unbiasing_summary.txt', 'r') as f:
                summary = f.read()
                logging.info(f"Unbiasing summary:\n{summary}")
        
        logging.info("Unbiasing pipeline completed successfully!")
        
        # create completion marker if job_id is provided
        if job_dir:
            (job_dir / "completed").touch()
        
    except Exception as e:
        logging.error(f"Error in pipeline: {str(e)}", exc_info=True)
        # create failure marker if job_id is provided
        if job_id and job_dir:
            (job_dir / "failed").touch()
    
    logging.info(f"Complete log available at: {log_file}")

if __name__ == "__main__":
    main() 