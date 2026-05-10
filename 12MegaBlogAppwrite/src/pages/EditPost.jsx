import React, {useEffect, useState} from "react";
import {Container, PostForm} from "../components"
import apiService from "../api/config"
import { useNavigate, useParams } from "react-router-dom";

function EditPost(){
    const [posts,setPosts] = useState(null);
    const {slug } = useParams()
    const navigate = useNavigate();
    useEffect(() => {
        if(slug){
            apiService.getPost(slug).then((post)=>{
                if(post) {
                    setPosts(post);
                }
            })
        }else{
            navigate("/");
        }
    },[slug,navigate]);
    return posts ? (
        <div className="py-8">
            <Container>
                <PostForm post = {posts} />
            </Container>
        </div>
    ) : null; 
}

export default EditPost ;