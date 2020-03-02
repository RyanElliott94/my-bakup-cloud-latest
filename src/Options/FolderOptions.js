import * as firebase from 'firebase/app';
require("firebase/database");
require("bootstrap/js/src");
require("firebase/storage");
const $ = require("jquery");


export default class FolderOptions {
    constructor(storagePath, folderName, folderID, ownerID){

        this.storagePath = storagePath;
        this.folderName = folderName;
        this.folderID = this.fodlerID;
        this.ownerID = ownerID;

       this.Data = {
            databaseRef: firebase.database().ref('folders/')
        }
    }

    createFolder = () => {
        var folderRef = firebase.database().ref('folders/').push().set({
            storagePath: this.folderName.includes(" ") ? this.folderName.split(" ").join("-").toLowerCase() :  this.folderName.toLowerCase(),
            folderName: this.folderName,
            ownerID: this.ownerID
          }, error => {
            if (error) {
              return error;
            } else {
            }
          }).then(() => {
              return "Success";
            $('.modal').modal('hide');
            // $(".f-items").remove();
            this.loadList()
          });

          return folderRef;
        }

        updateFolder = (key, values) => {
            this.state.databaseRef.once("value", snap => {
                snap.forEach(data => {
                    if(data.key === key){
                        this.state.databaseRef.update(values);
                    }
                })
            });
        }

        getFolders = () => {
            this.state.databaseRef.on('child_added', data => {
                if(data.val().ownerID === this.state.userID){
                    this.finalFolderList.push({
                        folderID: this.folderID,
                        storagePath: this.storagePath,
                        folderName: this.folderName,
                        ownerID: this.ownerID
                    });
                }
              });
        }
}