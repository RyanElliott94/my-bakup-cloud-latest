import React from "react";
import { Link, Route } from "react-router-dom";
import { FaFolder } from 'react-icons/fa';
import { AiFillFolderAdd } from "react-icons/ai";
import { FiLogOut } from "react-icons/fi";
import * as firebase from 'firebase/app';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { saveAs } from "file-saver";
require("firebase/database");
require("bootstrap/js/src");
require("firebase/storage");
const $ = require("jquery");

export default class Folders extends React.Component{
    constructor(props){
        super(props)

        this.state = {
            userID: props.currentUser.uid,
            databaseRef: firebase.database().ref('folders/'),
            folderList: [],
            folderName: "",
            storageFolderName: "",
            noFolders: false
        }

        this.finalFolderList = [];
        this.mq = window.matchMedia("(max-width: 480px)");
    }

    componentWillMount() {
        this.getFolders();
    }

    componentDidMount(){
        this.loadFolders = window.setInterval(() => {
            this.loadList();
        }, 1500);

        this.state.databaseRef.on("child_removed", (data) => {
            $(`#${data.key}`).remove();
        });

        $(document).on("contextmenu", e => {
            e.preventDefault();
        });

        $(document).on("click", ".create-folder-mod", e => {
            this.createFolder();
            $(".modal").modal("show");
        });

        $(document).on("click", ".create-folder", e => {
            this.createFolder();
            $(".modal").modal("show");
        });

        $(window).on("keydown", e => {
            if(e.shiftKey && e.ctrlKey && e.keyCode === 13){
                this.loadPrivateFolders();
            }
        });

    }

    createFolder = () => {
        var folderName = $("#main-folder-name").val();
        var isPrivate = $("#private-checkbox");
        this.state.databaseRef.push().set({
            storagePath: folderName.includes(" ") ? folderName.split(" ").join("-").toLowerCase() : folderName.toLowerCase(),
            folderName: $("#main-folder-name").val(),
            ownerID: this.state.userID,
            private: $(isPrivate).is(":checked") ? true : false
          }, error => {
            if (error) {
                console.log(error)
            }
          }).then(() => {
            $('.modal').modal('hide');
            $("#btn-folder").removeClass("create-folder"); 
            this.loadList()
          });
        }

        updateFolder = (key, values) => {
            firebase.database().ref(`folders/${key}`).update(values).then(data => {
                $("#btn-folder").removeClass("edit-folder");
                $(".modal").modal("hide");
                this.getFolders();
            });
        }

        
    getFolders = () => {
        this.state.databaseRef.on('child_added', data => {
            if(data.val().ownerID === this.state.userID && !data.val().private){
                this.finalFolderList.push({
                    folderID: data.key,
                    storagePath: data.val().storagePath,
                    folderName: data.val().folderName,
                    ownerID: data.val().ownerID
                });
            }
          });
    }

    loadPrivateFolders = () => {
        this.state.databaseRef.once('value', snap => {
            snap.forEach(data => {
                if(data.val().private){
                    this.finalFolderList.push({
                        folderID: data.key,
                        storagePath: data.val().storagePath,
                        folderName: data.val().folderName,
                        ownerID: data.val().ownerID
                    });
                }
            });
            this.loadList();
          });
    }

    loadList = () => {
        this.setState({
            folderList: this.finalFolderList
        });
        if(!this.state.folderList.length){
            this.setState({noFolders: true})
        }
    }

    logout = () => {
        firebase.auth().signOut().then(() => {
            window.location.pathname = "/";
        });
    }

    handleMenu = (e, data, target) => {
        switch(data.menuItem){
        case "item-0":
            e.preventDefault();
            var key = $(target).find(".folder-item").attr("id");
            $("#btn-folder").addClass("edit-folder");
            $(".modal").modal("show");

            $(document).on("click", ".edit-folder", e => {
                var folderName = $("#main-folder-name").val();
                var isPrivate = $("#private-checkbox");
                this.updateFolder(key, {folderName: folderName,
                private: $(isPrivate).is(":checked") ? true : false});
            });
            break;
        case "item-1":
            var id = $(target).find(".folder-item").attr("id");
            this.state.databaseRef.once("value", snap => {
                snap.forEach(data => {
                    if(data.key === id){
                        var listData = firebase.storage().ref(`${data.val().storagePath}/`).listAll();
                        listData.then(listData => {
                            listData.items.forEach(img => {
                             img.getDownloadURL().then(src => {
                                 var xhr = new XMLHttpRequest();
                                 xhr.responseType = 'blob';
                                 xhr.onload = function(event) {
                                     var blob = xhr.response;
                                     saveAs(blob, img.name);
                                 };
                                 xhr.open('GET', src);
                                 xhr.send();
                               });
                            });
                        });
                    }
                });
            });
            break;
        case "item-2":
            var id = $(target).find(".folder-item").attr("id");
            this.state.databaseRef.child(id).remove().then(() => {
                this.state.databaseRef.child(id).once("value", snap => {
                    snap.forEach(data => {
                        firebase.storage().ref(data.val().storagePath).delete();
                    });
                });
            });
            break;
        case "item-3":
            $(".command-txt").css({display:"block"});
                if($(".command-txt").val() === "Get that money"){
                    this.loadPrivateFolders();
                    $(".react-contextmenu").css({display:"none"});
                }
            break;
        }
    }

    noFolders(){
        $(".load-spin").css({display: "none"});
        $(".loading-text").text("");
        clearInterval(this.loadFolders);
        return this.state.folderList.length === 0 ? <p style={{textAlign:"center"}}>No Folders Were Found!</p> : ""
    }

    render(){
        return (
            <div>
            <section className="top-section">
                <div className="options">
            {this.mq.matches ? <AiFillFolderAdd className="new-folder-ico" color="white" onClick={() => {$("#btn-folder").addClass("create-folder-mod") 
            $(".modal").modal("show")}} /> : <button className="btn btn-sm" onClick={() => {$(".modal").modal("show")
            $("#btn-folder").addClass("create-folder")}}>Create a folder</button>}
            {this.mq.matches ? <FiLogOut className="logout-ico" color="white" onClick={this.logout} /> : <button className="btn btn-sm logout" onClick={this.logout}>Log Out</button>}
                </div>
            </section>
            <div className="folder-layout" >
            <div class="d-flex justify-content-center pt-3">
            <div class="spinner-border load-spin" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            </div>
            <p className="loading-text">Loading Folders...</p>
            {this.state.noFolders ? this.noFolders() : ""}
                <div className="folders">
            {this.state.folderList.length > 0 ? this.state.folderList.map((items, i) => {
                clearInterval(this.loadFolders);
                $(".load-spin").css({display: "none"})
                $(".loading-text").text("");
                return <Link className="f-items" key={i} to={{ 
                    pathname: '/gallery', 
                    state: {
                        storagePath: items.storagePath,
                        folderName: items.folderName,
                        loadImages: true
                    } 
                }}>
                    <ContextMenuTrigger id="menu">
                    <p className="folder-item" id={items.folderID}><FaFolder className="folder-icon" color="#5f9ea0" />{items.folderName}</p>
                    </ContextMenuTrigger>
                    </Link>
            }) : ""}
                </div>
                <div className="modal" tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Create a new folder</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    <label htmlFor="main-folder-name">Folder Name</label>
                    <input className="form-control" type="text" id="main-folder-name"></input>
                    <div class="form-group form-check">
                <input type="checkbox" class="form-check-input" id="private-checkbox"/>
                <label class="form-check-label" for="private-checkbox" style={{fontSize:"12px"}}>Private Folder?</label>
                </div>
                </div>
                <div className="modal-buttons">
                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" className="btn btn-primary" id="btn-folder">Create Folder</button>
                </div>
                </div>
            </div>
            </div>
            </div>

            <ContextMenu id="menu">
            <MenuItem data={{menuItem: 'item-0'}} onClick={this.handleMenu}>
            Edit Folder
            </MenuItem>
            <MenuItem data={{menuItem: 'item-1'}} onClick={this.handleMenu}>
            Download All Files
            </MenuItem>
            <MenuItem data={{menuItem: 'item-2'}} onClick={this.handleMenu}>
            Delete Folder
            </MenuItem>
            {this.mq.matches ? <MenuItem divider /> : null}
            {this.mq.matches ? 
            <MenuItem preventClose data={{menuItem: 'item-3'}} onClick={this.handleMenu}>
            Enter Command
            <input type="text" className="form-control command-txt" style={{display: "none"}}></input>
            </MenuItem>
            :
            null    
            }
            </ContextMenu>

            </div>
        )
    }
}