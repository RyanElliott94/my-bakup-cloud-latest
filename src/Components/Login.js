import React from "react";
import * as firebase from 'firebase';
require("firebase/auth");
const $ = require("jquery");

export default class Login extends React.Component{
    constructor(props){
        super(props)

        this.mq = window.matchMedia("(max-width: 480px)");
    }

    componentDidMount(){
        $(".login-btn").on("click", () => {
            firebase.auth().signInWithEmailAndPassword($("#email").val(), $("#password").val()).catch(function(error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                window.location.pathname = "/gallery"
              });
        });

        
    }

    render(){
        return (
            <div style={{transform: this.mq.matches ? "translateY(100%)" : "none"}}>
                <div className="login-content">
                <label htmlFor="email">Email</label>
                <input className="form-control" type="text" id="email" placeholder="Enter Email Address"></input>
    
                <label htmlFor="password">Password</label>
                <input className="form-control" type="password" id="password" placeholder="Enter Password"></input>
            </div>
            <div className="modal-buttons">
            <button className="btn login-btn">Sign In</button>
            </div>
            </div>
        );
    }
}