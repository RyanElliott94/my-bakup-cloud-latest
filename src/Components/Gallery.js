import React from "react";
import * as firebase from 'firebase';
import { PhotoSwipe } from "react-photoswipe";
import { MdAddCircle } from 'react-icons/md';
import { AiFillHome } from "react-icons/ai";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { saveAs } from "file-saver";
const Jimp = require('jimp');
require("firebase/database");
require("firebase/storage");
require("firebase/auth");
const $ = require("jquery");

export default class Gallery extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            videoRef: firebase.storage().ref(`${props.location.state.storagePath}/videos`),
            imageRef: firebase.storage().ref(`${props.location.state.storagePath}/`),
            thumbRef: firebase.storage().ref(`${props.location.state.storagePath}/thumbs`),
            fullSizeImages: [],
            originalListData: [],
            hasLoaded: false,
            noImages: false,
            showImage: false
        }

    this.mq = window.matchMedia("(max-width: 480px)");
    this.modifiedListData = [];
    this.newImagesList = [];
    this.numberPerPage = this.mq.matches ? 30 : 50;
    this.currentPage = 1;
    this.slicedFullSizeImages =[];
    this.numberOfPages = 0;
    this.imgData = [];
    this.isOpen = false;
    this.imgsForSwipe = [];
    this.fullSizeImageList = [];
    this.fullSizeIMGs = [];
    }

    componentWillMount(){
        this.addItemsToArray();
    }

    componentDidMount() {

        this.loadImages = setInterval(() => {
                this.loadList();
        }, 1500);

        $(".next").on("click", e => {
        this.currentPage += 1;
        this.loadList();
        });

        $(document).on("contextmenu", e => {
            e.preventDefault();
        });

    }

    // convertCurrentFiles = () => {
    //     clearInterval(this.loadImages)
    //     var tempList = [];
    //     var fileList = firebase.storage().ref("/test/").listAll();
    //     var thumbList = firebase.storage().ref("/test/thumbs/").listAll();
    //     thumbList.then(data => {
    //         data.items.forEach(item => {
    //             tempList.push({name: item.name});
    //         });
    //         console.log(tempList)
    //     });
    //     fileList.then(data => {
    //         data.items.map(item => {
    //                 if(!tempList.includes(item.name)){
    //                     item.getDownloadURL().then(url => {
    //                         Jimp.read(url)
    //                                 .then(data => {
    //                                 return data
    //                                     .resize(512, Jimp.AUTO)
    //                                     .getBase64(Jimp.AUTO, (err, src) => {
    //                                         this.uploadThumbnails(src, item.name);
    //                                     });
    //                                 })
    //                                 .catch(err => {
    //                                 console.error(err);
    //                                 });
    //                     });
    //                 }else{
    //                     console.log("file already exists!");
    //                 }
    //         });
    //     });
    // }

    addNewFile = () => {
        $(".new-photo-input").focus().trigger('click');
        $(".new-photo-input").on('change', (evt) => {
            for(var i = 0; i < evt.target.files.length; i++){
                var fileType = evt.target.files[i].type;
                var fileName = evt.target.files[i].name;
                var fileSize = evt.target.files[i].size;
                var updated = evt.target.files[i].lastModified;
                this.uploadPhoto(evt.target.files[i], {
                    contentType: fileType,
                    name: fileName,
                    size: fileSize,
                    updated: updated
                });
            }
        });
    }

    uploadPhoto(file, meta) {
        let progress = 0;
        const metadata = {
            meta
        };
        
        let upload = this.state.imageRef.child(file.name).put(file, meta);
        upload.on(firebase.storage.TaskEvent.STATE_CHANGED,
            (snapshot) => {
                progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                $(".progress-bar").css({display:"block"});
                $(".progress-bar").width(Math.round(progress) + "%");
                $(".progress-bar").text(`Uploading File.... %${Math.round(progress)}`);
            },
            (error) => {
                switch (error.code) {
                    case 'storage/unauthorized':
                        break;
                    case 'storage/unknown':
                        break;
                    default: 
                    break;    
                }
            }, () => {
                upload.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    this.tempList = [];
                    this.tempList.push(downloadURL);
                }).finally(() => {
                    if(firebase.storage.TaskState.SUCCESS){
                        this.tempList.forEach(img => {
                            $(".progress-bar").text(`Generating Thumbnails... %${Math.round(progress)}`);
                            Jimp.read(img)
                            .then(data => {
                            return data
                                .resize(512, Jimp.AUTO)
                                .getBase64(Jimp.AUTO, (err, src) => {
                                    this.uploadThumbnails(src, file.name);
                                });
                            })
                            .catch(err => {
                            console.error(err);
                            });
                            console.log("Finished Uploading!", img);
                        });
                    }
                });
            });
    }
    
    uploadThumbnails = (file, fileName) => {
        var upload = this.state.thumbRef.child(fileName).putString(file, 'data_url', {contentType: "image/jpg"});
        upload.on(firebase.storage.TaskEvent.STATE_CHANGED,
            (snapshot) => {
                let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                $(".progress-bar").css({display:"block"});
                $(".progress-bar").width(Math.round(progress) + "%");
                $(".progress-bar").text(`Uploading Thumbnails... %${Math.round(progress)}`)
            },
            (error) => {
                console.log(error)
                switch (error.code) {
                    case 'storage/unauthorized':
                        break;
                    case 'storage/unknown':
                        break;
                    default: 
                    break;    
                }
            }, () => {
                upload.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    $(".progress-bar").css({display:"none"});
                    upload.snapshot.ref.getMetadata().then(data => {
                        this.imgData.push({
                            index: 5000,
                        src: {
                            fileName: data.name,
                            thumbnail: downloadURL,
                            fileType: data.contentType
                        }});
                        this.loadList();
                        console.log(data)
                    });
                    this.tempList = [];
                    this.tempList.push(downloadURL);
                });
            }
            );
    }

    viewImage = event => {
        const index = $(event.target).attr("id");
        return <PhotoSwipe
        isOpen={this.isOpen = true} 
        items={this.imgData} 
        options={{index: parseInt(index), h: 3000, w: 3000}} 
        onClose={this.handleClose()}
        />
    }

    handleClose = () => {
        this.isOpen = false;
    }

    async addItemsToArray(){
        var fullSizedImages = await this.state.imageRef.listAll();
        var thumbs = await this.state.thumbRef.listAll();
            this.setState({
                thumbs: thumbs.items.reverse(),
                fullSizeImages: fullSizedImages.items
            });
        this.numberOfPages = this.getNumberOfPages()
    }
    
      loadList = () => {
        //   $(".react-contextmenu-wrapper").remove();
        //   $("img").remove();
         var begin = ((this.currentPage - 1) * this.numberPerPage);
    
         var end = begin + this.numberPerPage;

         this.modifiedListData = this.state.thumbs.slice(begin, end);
         this.slicedFullSizeImages = this.state.fullSizeImages.slice(begin, end);

         this.modifiedListData.map((item, i) => {
                item.getDownloadURL().then(url => {
                item.getMetadata().then(data => {
                    this.imgData.push({
                        index: i,
                        src: {
                            fileName: item.name,
                            thumbnail: url,
                            fileType: data.contentType
                        }
                        });
                    });
                });
            });
         this.getFullSizeImages();
         this.drawList();

         return;
      }

      getFullSizeImages = () => {
          this.slicedFullSizeImages.forEach(item => {
                item.getDownloadURL().then(url => {
                    this.fullSizeImageList.push(
                        {
                            fileName: item.name,
                            src: url
                        }
                    );
                 });
          });

      }

      handleMenu = (e, data, target) => {
          switch(data.menuItem){
            case "item-1":
                var fileName = $(target).find(".image-item").attr("id");
                this.state.fullSizeImages.forEach(img => {
              if(img.name === fileName){
                    img.getDownloadURL().then(src => {
                        var xhr = new XMLHttpRequest();
                        xhr.responseType = 'blob';
                        xhr.onload = function(event) {
                            var blob = xhr.response;
                            saveAs(blob, fileName);
                        };
                        xhr.open('GET', src);
                        xhr.send();
                      });
              }
          });
              break;
            case "item-2":
                var fileName = $(target).find(".image-item").attr("id");
                this.state.imageRef.child(fileName).delete().then(() => {
                    this.state.thumbRef.child(fileName).delete();
                }).catch(error => {
                    console.log(error)
                });
              break;
          }
      }

      showImage = (e, data, target) => {
          var fileName = $(e.target).closest(".image-item").attr("id");

            this.state.fullSizeImages.forEach(img => {
                if(img.name === fileName){
                    img.getDownloadURL().then(src => {
                        window.open(src)
                    });
                }
            });
      }


      getNumberOfPages() {
        return Math.ceil(this.imgData.length / this.numberPerPage);
    }

    

    drawList = () => {
        if(this.state.thumbs.length){
            this.setState({
                hasLoaded: true
            });
        }else{
            this.setState({noImages: true})
        }

        // this.imgData.sort(function (x, y) {
        //     return x.index - y.index;
        // });
    }


    noImages(){
        $(".load-spin").css({display: "none"});
        $(".loading-text").text("");
        clearInterval(this.loadImages)
        return this.imgData.length === 0 ? <p>No Images Were Found!</p> : ""
    }


    render(){
        return (
            <div>
                <section className="top-section">
                <div className="options">
                <p className="folder-name">{this.props.location.state.folderName}</p>
                {this.mq.matches ? <a className="home-ico" href="/"><AiFillHome color="white" /></a> : <a className="home-link" href="/">Home</a>}
                {this.mq.matches ? <MdAddCircle className="add-photo-ico" color="white" onClick={this.addNewFile} /> : <button className="btn btn-sm" onClick={this.addNewFile} id="add-photo">Add more photo's</button>}
                </div>
                <input type="file" name="file" accept="image/*" id="add-photo" className="new-photo-input" style={{display:"none"}} multiple></input>
                </section>
            <div className="gal-content">
                <div className="progress">
                <div className="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" ></div>
                </div>
                <section className="image-content">
                <div className="col">
                <div className="spinner-border text-info load-spin" role="status">
                <span className="sr-only">Loading...</span>
                </div>
                <p className="loading-text">Loading...</p>
                <div className="image-grid">
                {this.state.hasLoaded ? this.imgData.map((item, i) => {
                    $(".load-spin").css({display: "none"})
                    $(".loading-text").text("");
                    clearInterval(this.loadImages);
                    return <ContextMenuTrigger id="menu">
                          <img className="img image-item" key={i} id={item.src.fileName} onClick={this.showImage} src={item.src.thumbnail} download={item.src.thumbnail}></img>
                    </ContextMenuTrigger>
                        }) : ""}
                    </div>
                    {this.state.noImages ? this.noImages() : null}
                    </div>
                <div className="controls">
                <button className="btn btn-sm next"value="next">Show More</button>
                </div>
                </section>
            </div>

            <ContextMenu id="menu">
            <MenuItem data={{menuItem: 'item-0'}} onClick={this.showImage}>
            View image in a new tab
            </MenuItem>
            <MenuItem data={{menuItem: 'item-1'}} onClick={this.handleMenu}>
            Download File
            </MenuItem>
            <MenuItem data={{menuItem: 'item-2'}} onClick={this.handleMenu}>
            Delete this file
            </MenuItem>
            </ContextMenu>
            </div>
        );
    }
}