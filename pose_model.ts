import * as tmPose from '@teachablemachine/pose';
        const URL = "https://teachablemachine.withgoogle.com/models/6Mizp6iQ/";
        let model, webcam, ctx, maxPredictions;
        async function init() {
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";
            // load the model and metadata
            // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
            // Note: the pose library adds a tmPose object to your window (window.tmPose)
            model = await tmPose.load(modelURL, metadataURL);
            const videoParent = document.getElementById('webcam-parent');
            document.getElementById('playground').style.display = 'table';
            document.getElementById('loading-page').style.display = 'none';
            maxPredictions = model.getTotalClasses();
            // Convenience function to setup a webcam
            const sizeH = 200;
            const sizeW = 200;
            const flip = true; // whether to flip the webcam
            webcam = new tmPose.Webcam(sizeW, sizeH, flip); // width, height, flip
            
            await webcam.setup(); // request access to the webcam
            await webcam.play();

            setInterval(loop,100);
            // append/get elements to the DOM
            const canvas = document.getElementById("canvas") as HTMLCanvasElement;
            canvas.width = sizeW; 
            canvas.height = sizeH;
            ctx = canvas.getContext("2d");
            //labelContainer = document.getElementById("label-container");
            //for (let i = 0; i < maxPredictions; i++) { // and class labels
                //labelContainer.appendChild(document.createElement("div"));
            //}
        }
        async function loop(timestamp) {
            webcam.update(); // update the webcam frame
            await predict();
            
            //window.requestAnimationFrame(loop);
        }
        async function predict() {
            // Prediction #1: run input through posenet
            // estimatePose can take in an image, video or canvas html element
            const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
            // Prediction 2: run input through teachable machine classification model
            const prediction = await model.predict(posenetOutput);
            let classPrediction;
            let className;
            for (let i = 0; i < maxPredictions; i++) {
                if(i === 0){
                    classPrediction = prediction[i].probability.toFixed(2);
                    className = prediction[i].className;
                }
                else {
                    if(prediction[i].probability > classPrediction){
                        classPrediction = prediction[i].probability.toFixed(2);
                        className = prediction[i].className;
                    }

                }
                
            }

            const predictionThereshold = .7; 
            const detect = (window as any).Detect;
            console.log(className + ":" + classPrediction);
            if (className === "nothing") {
                console.log('Nothing: ' + classPrediction);
                detect.onStand();
            } else if (className === "backward" && classPrediction >=  predictionThereshold  ) {
                console.log('Backward:' + classPrediction);
                detect.onBackward();
            } else if (className === "forward" && classPrediction >= predictionThereshold) {
                console.log('Forward:' + classPrediction);
                detect.onForward();
            }else if (className === "punch" && classPrediction >= .9) {
                console.log('Punch:' + classPrediction);
                detect.onPunch();
            }else if (className === "kick" && classPrediction >= predictionThereshold) {
                console.log('Kick:' + classPrediction);
                detect.onKick();
            } else if (className === "squat" && classPrediction >= predictionThereshold) {
                console.log('Squat:' + classPrediction);
                detect.onSquat();
            } else {
                console.log('Default Nothing!');
                detect.onStand();
            }
            // finally draw the poses
            drawPose(pose);
        }
        function drawPose(pose) {
            if (webcam.canvas) {
                ctx.drawImage(webcam.canvas, 0, 0);
                // draw the keypoints and skeleton
                if (pose) {
                    const minPartConfidence = 0.5;
                    tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                    tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
                }
            }
        }

        init();