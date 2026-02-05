---
title: "Variational Auto-Encoders (VAEs): The only introduction you will ever need!"
date: 2026-02-04
permalink: /posts/2026/02/genai-vae-intro/
tags:
  - GenAI
  - 2026
comments: true
redirect_from: 
header:
  preview_card_image: 
---

<!-- <figure>
  <img src="./../../../../images/2023-11-11-slurm-jupyter-intro-image.jpg" alt="Photo generated with AI by Bing.">
  <figcaption>
    <span class="caption"></span>
    <!-- <i class="photo-credit">Photo generated with AI by Microsoft Bing.</i> -->
  <!-- </figcaption>
</figure> --> 

The goal of generative AI is to model complex data distributions and generate novel samples that are indistinguishable from real data. 

Variational Auto-Encoders (VAEs) achieve this by a so-called *probabilistic decoder* model that takes in a code vector $\mathbf{z}$ and outputs a sample from the modeled data distribution. 

The code vector $\mathbf{z}$ is constrained to follow a simple distribution, such as the Normal distribution,

\\[ p(\mathbf{z})=\mathcal{N}(\mathbf{0}, \mathbf{1}).\\]

This constraint is essential so that it is efficient to sample code vectors from $p(\mathbf{z})$ when it is a Normal distribution as opposed to the case where it is a complicated distribution (and requires )










[Slurm](https://slurm.schedmd.com/documentation.html) is a popular choice for job scheduling and management on GPU clusters with multiple compute nodes that are ubiquitous for training large deep learning models. 

{% include toc %}

A Slurm GPU cluster consists of one or more head (or login) nodes and multiple compute nodes. Generally, the head nodes are lighter on compute resources (eg. no GPUs, low RAM, etc). It is a common practice by system admins to prevent users from logging into compute nodes directly from the head node bypassing Slurm resource allocation (see [PAM](https://slurm.schedmd.com/faq.html#pam)). 

In this post, we'll set up a [Jupyter Notebook](https://jupyter.org/) server on an allocated compute node without having to directly SSH to it from the head node. To access the server locally, we'll setup port-forwarding from the compute node to the local machine via an SSH tunnel through the head node.



### Log into Slurm Head Node

First, make sure that you can log into the Slurm head node <code style="color: #0072be; background: #f4f2f9;">&lt;slurm_head_node&gt;</code>. 
Check by running SSH with the following command in the Terminal on your local machine:

```sh
ssh -p <ssh_port> <slurm_username>@<slurm_head_node> -i <path_to_the_rsa_private_key_file>
```

### Request Slurm Compute

Once logged into the head node, compute resources can be requested using the Slurm command `srun`, which spins up an interactive shell on a compute node with the resources requested:

```sh
srun --partition=<slurm_partition> --gres=gpu:1 --mem=50G --pty bash -l  
```

Here, we requested a Slurm compute node with at least one GPU and 50 GB of memory (RAM). Once resources are allocated, the shell in the Terminal session logs into the compute node <code style="color: #0072be; background: #f4f2f9;">&lt;slurm_compute_node&gt;</code>.

### Run Jupyter Server

To run a Jupyter Notebook server in the background that does not terminate with the Terminal shell session, use [Tmux](https://github.com/tmux/tmux/wiki) or [GNU Screen](https://www.gnu.org/software/screen/). Here we use `tmux` by creating a tab named <code style="color: #0072be; background: #f4f2f9;">jupyter_tmux</code> on the allocated compute node:
```sh
tmux new -s "jupyter_tmux"
```

Now, launch a Jupyter Notebook server within the `tmux` session by running:
```sh
jupyter notebook --no-browser --port <jupyter_port>
```
Detach from the `tmux` session by pressing <code style="color: #0072be; background: #f4f2f9;">ctrl</code> and <code style="color: #0072be; background: #f4f2f9;">b</code> keys at the same time, followed by <code style="color: #0072be; background: #f4f2f9;">d</code>.

### Forward Ports By SSH Tunneling

With the Jupyter server running on the Slurm compute node, the next step is to forward the port <code style="color: #0072be; background: #f4f2f9;">&lt;jupyter_port&gt;</code> from the compute node to the local machine via an SSH tunnel through the head node.  
Open a new Terminal session on the local computer and run:

```sh
# on local Terminal
ssh -A -N -f -o "ProxyCommand ssh -W %h:%p -p <ssh_port> <slurm_username>@<slurm_head_node> -i <path_to_the_rsa_private_key_file>" -L localhost:<jupyter_port>:localhost:<jupyter_port> <slurm_username>@<slurm_compute_node> -i <path_to_the_rsa_private_key_file>
```


Voila! The Jupyter Notebook server should be accessible from the local machine at <code style="color: #0072be; background: #f4f2f9;">http://localhost:&lt;jupyter_port&gt;/</code>!

### References

[1] Slurm, [https://slurm.schedmd.com/](https://slurm.schedmd.com/).    
[2] Jupyter, [https://jupyter.org/](https://jupyter.org/).  
[3] Tmux, [https://github.com/tmux/tmux/wiki](https://github.com/tmux/tmux/wiki).  
[4] GNU Screen, [https://www.gnu.org/software/screen/](https://www.gnu.org/software/screen/).    


### Citation


If you liked this article, consider subscribing to the blog's mailing list here: <a class="btn btn--warning" target="_blank" href="/subscribe/" role="button" style="text-decoration:none">Subscribe</a> 


To cite this work, please use:

> Bhaskara, Vin (Nov 2023). Hosting Jupyter Notebooks on Slurm. https://vinbhaskara.github.io/posts/2023/11/slurm-jupyter/

or,

> ```json
> @article{bhaskara2023slurm,
>   title   = "Hosting Jupyter Notebooks on Slurm",
>   author  = "Bhaskara, Vin",
>   journal = "vinbhaskara.github.io",
>   year    = "2023",
>   month   = "Nov",
>   url     = "https://vinbhaskara.github.io/posts/2023/11/slurm-jupyter/"
> }
> ```




