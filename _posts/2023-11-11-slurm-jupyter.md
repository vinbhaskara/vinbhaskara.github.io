---
title: 'Hosting Jupyter Notebooks on Slurm'
date: 2023-11-11
permalink: /posts/2023/11/slurm-jupyter/
tags:
  - MLOps
comments: true
redirect_from: 
  - /posts/2013/11/slurm-jupyter/ # to address a typo in the link shared on social media haha
---


GPU clusters with multiple compute nodes are ubiquitous for training large deep learning models. [Slurm](https://slurm.schedmd.com/documentation.html) is a popular choice for job scheduling and management on such systems.

In this post, we'll set up a [Jupyter Notebook](https://jupyter.org/) server running on a Slurm compute node that is accessible from a local machine.

{% include toc %}

First, make sure that you can log into the Slurm head node. 
Check by running SSH with the following command in the Terminal on your local machine:

```sh
ssh -p <ssh_port> <slurm_username>@<slurm_head_node> -i <path_to_the_rsa_private_key_file>
```

Once logged into the head node, compute resources can be requested using the Slurm command `srun`, that spins up an interactive shell on a compute node with the resources requested:

```sh
srun --partition=<slurm_partition> --gres=gpu:1 --mem=50G --pty bash -l  
```

Here, we requested a Slurm compute node with at least one GPU and 50 GB of memory (RAM). Once resources are allocated, the shell in the Terminal session logs into the compute node.

To establish a Jupyter Notebook server in the background that does not terminate with the Terminal shell session, use `tmux` or `screen`. Here we use `tmux` by creating a tab named `jupyter_tmux` on the allocated compute node:
```sh
tmux new -s "jupyter_tmux"
```

Now, launch a Jupyter Notebook server within the `tmux` session by running:
```sh
jupyter notebook --no-browser --port <jupyter_port>
```
Detach from the `tmux` session by pressing `Ctrl` and `b` keys at the same time, followed by `d`.

With the Jupyter server running on the Slurm compute node, the next step is to forward it through SSH to the local computer via the Slurm head node.

Open a new Terminal session on the local computer. Forward the Jupyter Server port from the compute node to the local machine's ports using SSH tunneling as follows:

```sh
# on local Terminal
ssh -A -N -f -o "ProxyCommand ssh -W %h:%p -p <ssh_port> <slurm_username>@<slurm_head_node> -i <path_to_the_rsa_private_key_file>" -L localhost:<jupyter_port>:localhost:<jupyter_port> <slurm_username>@<slurm_compute_node> -i <path_to_the_rsa_private_key_file>
```

Voila! The Jupyter Notebook server should be accessible from the local machine at `http://localhost:<jupyter_port>/`!


Citation
---

If you found this post helpful, please cite as:

> Bhaskara, Vineeth S. (Nov 2023). Hosting Jupyter Notebooks on Slurm. https://vinbhaskara.github.io/posts/2023/11/slurm-jupyter/

or,

```json
@article{bhaskara2023slurm,
  title   = "Hosting Jupyter Notebooks on Slurm",
  author  = "Bhaskara, Vineeth S.",
  journal = "vinbhaskara.github.io",
  year    = "2023",
  month   = "Nov",
  url     = "https://vinbhaskara.github.io/posts/2023/11/slurm-jupyter/"
}
```


