import os
import pandas as pd
import cohere
from dotenv import load_dotenv
import json
from pathlib import Path
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# load environment variables from .env file
load_dotenv()

# get Cohere API key
CO_API_KEY = os.getenv("COHERE_API_KEY")
co = cohere.ClientV2(CO_API_KEY)

def analyze_cluster(cluster_df, cluster_num):
    """
    analyze a cluster using Cohere LLM to identify patterns.
    
    args:
        cluster_df: DataFrame containing the cluster data
        cluster_num: the number/identifier of the cluster
    
    returns:
        the analysis results from Cohere
    """
    # sample some resumes from the cluster (limit to 5 to avoid token limits)
    sample_size = min(20, len(cluster_df))
    sample_df = cluster_df.sample(sample_size)
    
    # prepare the prompt with resume samples
    resume_samples = []
    
    for i, row in sample_df.iterrows():
        # get the resume text and truncate if too long
        resume_text = str(row['Resume_str'])[:2000]  # limit to 2000 chars
        
        sample = f"Resume #{i}:\n{resume_text}\n\n"
        resume_samples.append(sample)
    
    resume_text = "\n".join(resume_samples)
    
    # craft the prompt
    prompt = f"""`
    I have a cluster (Cluster #{cluster_num}) of resume data. Here are {sample_size} sample resumes from this cluster:
    
    {resume_text}
    
    Based on only these samples, please analyze and identify:
    - Common skills, experiences, or qualifications in this cluster
    - The likely job roles or industries these resumes target
    - Any other notable patterns or similarities
    
    Format your response as a concise, direct, three sentence summary of the cluster. 
    Three sentences maximum for the whole response. 
    Do not use markdown. 
    Give a brief title for the cluster, then give two newlines, then give the summary.
    
    You can use markdown for the title. DO NOT USE MARKDOWN FOR THE SUMMARY.
    
    """
    
    # make the API call to Cohere with error handling
    try:
        response = co.chat(
            model="command-a-03-2025",
            messages=[{"role": "user", "content": prompt}]
        )
        print(response)
        return response.message.content[0].text
    except Exception as e:
        error_message = f"Error calling Cohere API: {str(e)}"
        print(f"ERROR: {error_message}")
        
        # log the error to a file
        with open("cohere_api_errors.log", "a") as error_log:
            import datetime
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            error_log.write(f"[{timestamp}] Cluster {cluster_num}: {error_message}\n")
            
        # return error message as the analysis result
        return f"ANALYSIS FAILED: {error_message}\n\nPlease check cohere_api_errors.log for details."

def save_cluster_embeddings(cluster_df, cluster_num, clusters_dir):
    """
    save embeddings for resumes in this cluster and convert to 6D using PCA.
    
    args:
        cluster_df: DataFrame containing the cluster data
        cluster_num: the number/identifier of the cluster
        clusters_dir: path to the clusters directory
        
    returns:
        path to the saved embeddings file
    """
    print(f"Calculating embeddings for Cluster {cluster_num}...")
    
    # check if embeddings file exists
    if not os.path.exists("resume_embeddings.npy"):
        print(f"ERROR: Embeddings file 'resume_embeddings.npy' not found. Cannot save cluster embeddings.")
        return None
    
    # load all embeddings
    all_embeddings = np.load("resume_embeddings.npy")
    
    # get resume indices from the cluster
    # first determine if we have an index column or need to use DataFrame index
    if 'Unnamed: 0' in cluster_df.columns:
        # this is likely the original index
        resume_indices = cluster_df['Unnamed: 0'].values
    else:
        # use the DataFrame index directly
        resume_indices = cluster_df.index.values
    
    # ensure indices are within range
    valid_indices = [idx for idx in resume_indices if idx < len(all_embeddings)]
    
    if not valid_indices:
        print(f"WARNING: No valid indices found for Cluster {cluster_num}. Skipping embeddings extraction.")
        return None
    
    # extract embeddings for this cluster
    cluster_embeddings = all_embeddings[valid_indices]
    
    # save full-dimensional embeddings
    embeddings_data = {
        "cluster_id": cluster_num,
        "total_embeddings": len(valid_indices),
        "embeddings": [
            {
                "id": i,
                "resume_id": int(resume_id),
                "cluster_id": cluster_num,
                "embedding": embedding.tolist()
            }
            for i, (resume_id, embedding) in enumerate(zip(valid_indices, cluster_embeddings))
        ]
    }
    
    # save to a JSON file in the clusters directory
    embeddings_file = clusters_dir / f"cluster_{cluster_num}_embeddings.json"
    with open(embeddings_file, 'w') as f:
        json.dump(embeddings_data, f)
    
    print(f"  Saved {len(valid_indices)} full-dimensional embeddings to {embeddings_file}")
    
    # now reduce to 6D with PCA
    # first standardize the data
    scaler = StandardScaler()
    scaled_embeddings = scaler.fit_transform(cluster_embeddings)
    
    # apply PCA
    pca = PCA(n_components=6)
    embeddings_6d = pca.fit_transform(scaled_embeddings)
    
    # normalize the embeddings to match unbiased embeddings
    embeddings_6d = normalize_embeddings(embeddings_6d)
    
    # create data structure for 6D embeddings
    embeddings_6d_data = {
        "cluster_id": cluster_num,
        "total_embeddings": len(valid_indices),
        "dimensions": 6,
        "embeddings": [
            {
                "id": i,
                "resume_id": int(resume_id),
                "cluster_id": cluster_num,
                "embedding": embedding.tolist()
            }
            for i, (resume_id, embedding) in enumerate(zip(valid_indices, embeddings_6d))
        ]
    }
    
    # save 6D embeddings to a separate JSON file
    embeddings_6d_file = clusters_dir / f"cluster_{cluster_num}_embeddings_6d.json"
    with open(embeddings_6d_file, 'w') as f:
        json.dump(embeddings_6d_data, f)
    
    # also save as NPY for more efficient loading
    embeddings_6d_npy_file = clusters_dir / f"cluster_{cluster_num}_embeddings_6d.npy"
    np.save(embeddings_6d_npy_file, embeddings_6d)
    
    print(f"  Saved {len(valid_indices)} 6D embeddings to {embeddings_6d_file} and {embeddings_6d_npy_file}")
    
    # calculate and print explained variance
    explained_variance = sum(pca.explained_variance_ratio_) * 100
    print(f"  PCA explained variance with 6 components: {explained_variance:.2f}%")
    
    return embeddings_file

def normalize_embeddings(embeddings):
    """
    normalize each embedding vector to unit length (L2 norm)
    """
    # calculate L2 norm (magnitude) of each vector
    norms = np.sqrt(np.sum(np.square(embeddings), axis=1, keepdims=True))
    # prevent division by zero
    norms = np.maximum(norms, 1e-10)
    # normalize to unit vectors
    normalized_embeddings = embeddings / norms
    return normalized_embeddings

def export_complete_dataset(cluster_files):
    """
    export the original dataset with cluster information
    """
    print("Exporting complete dataset with cluster information...")
    
    # first, load all individual cluster files to get the mapping
    cluster_mapping = {}
    for cluster_file in cluster_files:
        cluster_num = int(cluster_file.stem.split("_")[1])
        cluster_df = pd.read_csv(cluster_file)
        
        # get original indices if available or row numbers otherwise
        if 'Unnamed: 0' in cluster_df.columns:
            indices = cluster_df['Unnamed: 0'].tolist()
        else:
            # create a synthetic index based on row position
            indices = cluster_df.index.tolist()
            
        # map these indices to this cluster
        for idx in indices:
            cluster_mapping[idx] = cluster_num
    
    # load the original dataset
    try:
        # try cleaned file first (should exist from embeddings.py)
        if os.path.exists('cleaned_resumes.csv'):
            print("Loading cleaned_resumes.csv...")
            df = pd.read_csv('cleaned_resumes.csv')
        else:
            # try original source
            print("Loading original dataset...")
            try:
                df = pd.read_csv("hf://datasets/sankar12345/Resume-Dataset/Resume.csv")
            except Exception:
                print("Trying local file...")
                df = pd.read_csv("Resume.csv")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return
    
    # add cluster information
    df['cluster'] = -1  # default to noise/unclustered
    
    # map indices to clusters
    for i, row in df.iterrows():
        if i in cluster_mapping:
            df.at[i, 'cluster'] = cluster_mapping[i]
    
    # create the clusters directory if it doesn't exist
    clusters_dir = Path("clusters")
    clusters_dir.mkdir(exist_ok=True)
    
    # save the complete dataset with cluster information
    complete_file = clusters_dir / "all_clusters.csv"
    df.to_csv(complete_file, index=False)
    print(f"Saved complete dataset with cluster information to {complete_file}")
    
    # print cluster distribution
    cluster_counts = df['cluster'].value_counts().sort_index()
    print("\nCluster distribution:")
    for cluster, count in cluster_counts.items():
        if cluster != -1:
            print(f"Cluster {cluster}: {count} entries")
    print(f"Noise/Unclustered: {cluster_counts.get(-1, 0)} entries")
    
    return df

def main():
    # create directory for analysis results
    output_dir = Path("cluster_analysis")
    output_dir.mkdir(exist_ok=True)
    
    # get clusters from the individual CSV files
    clusters_dir = Path("clusters")
    
    # check if clusters directory exists
    if not clusters_dir.exists():
        print("Error: Clusters directory not found. Run embeddings.py first to generate clusters.")
        return
    
    # get all cluster files
    cluster_files = list(clusters_dir.glob("cluster_*.csv"))
    
    if not cluster_files:
        print("No cluster files found in the clusters directory.")
        return
    
    print(f"Found {len(cluster_files)} cluster files.")
    
    # export complete dataset with cluster information
    export_complete_dataset(cluster_files)
    
    # analyze each cluster
    all_analyses = {}
    
    for cluster_file in cluster_files:
        cluster_num = int(cluster_file.stem.split("_")[1])
        print(f"Analyzing Cluster {cluster_num}...")
        
        # load the cluster data
        cluster_df = pd.read_csv(cluster_file)
        print(f"  Cluster size: {len(cluster_df)} resumes")
        
        # save embeddings for this cluster (now includes 6D conversion)
        save_cluster_embeddings(cluster_df, cluster_num, clusters_dir)
        
        # analyze the cluster
        analysis = analyze_cluster(cluster_df, cluster_num)
        
        # save the analysis
        all_analyses[f"Cluster {cluster_num}"] = analysis
        
        # save individual analysis to file
        with open(output_dir / f"cluster_{cluster_num}_analysis.txt", "w") as f:
            f.write(analysis)
        
        print(f"  Analysis complete for Cluster {cluster_num}")
        print(f"  Results saved to {output_dir}/cluster_{cluster_num}_analysis.txt")
        print("\n" + "="*80 + "\n")
        
        # print a preview of the analysis
        print(f"ANALYSIS PREVIEW FOR CLUSTER {cluster_num}:")
        print(analysis[:500] + "...\n")
    
    # save all analyses to a single JSON file
    with open(output_dir / "all_clusters_analysis.json", "w") as f:
        json.dump(all_analyses, f, indent=2)
    
    print(f"All analyses saved to {output_dir}/all_clusters_analysis.json")

if __name__ == "__main__":
    main() 