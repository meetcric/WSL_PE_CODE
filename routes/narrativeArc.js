var express = require("express");
var router = express.Router();
var ObjectId = require("mongodb").ObjectID;
var User = require("../model/user");
var LearningMap = require("../model/learningMap");
var Resource = require("../model/resource");
var LearningPathways = require("../model/learningPathways");
var progress = require("../model/progress");
var ResourceGroup = require("../model/resourcegroup");
var Authenticator = require("../middleware/authenticator");
var mysql = require("mysql");
const config = require("../config/app_config");
const path = require("path");

router.get(
    "/teacher/:id",
    Authenticator.ensureAuthenticated,
    async(req, res) => {
        var pathwayId = req.params.id;
        var pathways = await LearningPathways.getLearningPathwaysByPathwayId(
            pathwayId
        );
        var rsrIds = pathways.map((item) => item.resourceId);
        var grpIds = pathways.map((item) => item.groupId);
        var rsrList = {};
        for (let i = 0; i < grpIds.length; i++) {
            rsrList[i] = await Resource.getResourceByResourceId(rsrIds[i]); //Because using Resource.getResourceListByResourceId(rsrIds) wasn't giving rsrList in proper order
        }
        console.log(`resource ids :\t${rsrIds}\ngrpids :\t ${grpIds}`);

        res.render("NAteacher", {
            layout: "layoutDiscussions",
            user: req.user,
            username: req.user.username,
            r_id: req.params.id,
            resourceList: rsrList,
            resourceIds: rsrIds,
            groupIds: grpIds,
            dtype: "path",
        });
    }
);

// newly added API call
// to get resources segment wise
router.get(
    "/teacher/getSegmentSummary/:pid/:gid",
    // Authenticator.ensureAuthenticated,
    async(req, res) => {
        var pathwayId = req.params.pid;
        var groupId = req.params.gid;
        console.log(groupId);
        console.log(pathwayId);
        var pathways = await LearningPathways.getLearningPathwaysByPathwayId(
            pathwayId
        );
        var rsrIds = pathways.map((item) => item.resourceId);
        var grpIds = pathways.map((item) => item.groupId);
        var rsrList = {};

        for (let i = 0; i < grpIds.length; i++) {
            if (grpIds[i] == groupId)
                rsrList[i] = await Resource.getResourceByResourceId(rsrIds[i]); //Because using Resource.getResourceListByResourceId(rsrIds) wasn't giving rsrList in proper order
        }

        console.log({ rsrList });
        res.send({ rsrList });
    }
);

router.get("/:id", Authenticator.ensureAuthenticated, async(req, res) => {
    var pathwayId = req.params.id;
    var pathways = await LearningPathways.getLearningPathwaysByPathwayId(
        pathwayId
    );
    var rsrIds = pathways.map((item) => item.resourceId);
    var grpIds = pathways.map((item) => item.groupId);
    var rsrList = {};

    for (let i = 0; i < grpIds.length; i++) {
        rsrList[i] = await Resource.getResourceByResourceId(rsrIds[i]); //Because using Resource.getResourceListByResourceId(rsrIds) wasn't giving rsrList in proper order
    }
    console.log("test\n\n\n");
    console.log(rsrList);
    console.log("\n\n");
    console.log(grpIds);
    progress.collection.findOne({ user_id: req.user.id, pathway_id: req.params.id },
        function(err, progress) {
            if (err) throw err;
            res.render("narrativeArc", {
                layout: "layoutNarrativeArc",
                user: req.user,
                username: req.user.username,
                id: req.params.id,
                resourceList: rsrList,
                resourceIds: rsrIds,
                groupIds: grpIds,
                Conversation_ID: req.user.id,
                // progress: progress
                progress: null,
            });
        }
    );
});

//newly added API call
router.post("/SetOverview/:id/:gid", async(req, res) => {
    var con = mysql.createConnection({
        host: config.MYSQL_HOST,
        user: config.MYSQL_USERNAME,
        password: config.MYSQL_PASSWORD,
        database: config.MYSQL_DB,
    });

    console.log("connected");

    var update_overview = req.body.update_overview;
    var cid = req.params.id;
    var gid = req.params.gid;

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected to mysql database");

        // var sql = "UPDATE Collection_Gp SET overview=" + update_overview + "  WHERE collection_id=" + cid + " AND group_id=" + gid;
        var sql =
            "UPDATE Collection_Gp SET overview =?  WHERE collection_id =?  AND group_id =?";

        con.query(sql, [update_overview, cid, gid], function(err, result) {
            if (err) throw err;
            console.log(result.affectedRows + " record(s) updated");
        });
    });

    res.send({ updated: "111" });
});

//newly added API call
router.post("/SetQuizDetails/:qno/:cid/:gid", async(req, res) => {
    var con = mysql.createConnection({
        host: config.MYSQL_HOST,
        user: config.MYSQL_USERNAME,
        password: config.MYSQL_PASSWORD,
        database: config.MYSQL_DB,
    });

    console.log("connected");

    var cid = req.params.cid;
    var gid = req.params.gid;

    var quiz_id = "0" + cid.substring(1) + "_" + gid; // format: 0 + collection_id {numbers part only}+ _ + groupid

    // var update_overview = req.body.update_overview;
    console.log("data");
    console.log(req.body);
    var update_string = JSON.stringify(req.body);

    // var qno = "ques" + req.params.qno;
    // var question = req.body.question;
    // var answer = req.body.answer;
    // var option1 = req.body.option1;
    // var option2 = req.body.option2;
    // var option3 = req.body.option3;

    // var to_update = {};
    // var question_string = {};

    // question_string["ques"] = question;
    // question_string["answer"] = answer;
    // question_string["option1"] = option1;
    // question_string["option2"] = option2;
    // question_string["option3"] = option3;

    // to_update[qno] = question_string;
    // to_update["n"] = 1; // n == # of quesrion

    // const update_string = JSON.stringify(to_update);
    // console.log(update_string);
    // question string
    // {'ques1': {'ques': 'What have umbrella-shaped bodies and tetramerous symmetry?', 'answer': 'cnidarians', 'option1': 'sting', 'option2': 'salamander', 'option3': 'caribbean'}

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected to mysql database");

        // var sql = "UPDATE Collection_Gp SET overview=" + update_overview + "  WHERE collection_id=" + cid + " AND group_id=" + gid;
        var sql = "UPDATE quiz_table SET question =?  WHERE quiz_id =?";

        con.query(sql, [update_string, quiz_id], function(err, result) {
            if (err) throw err;
            console.log(result.affectedRows + " record(s) updated");
        });
    });

    // res.send({ updated: update_string, update1: to_update });
});

router.post(
    "/setUserProgress",
    Authenticator.ensureAuthenticated,
    async(req, res) => {
        //console.log(req.body.user_progress)
        //console.log(req.body.data)
        //console.log(req.body)
        // console.log("OMKAR AND AKSHAT");
        var GotProgress = req.body;
        console.log(GotProgress.user_id);

        progress.findOne({
                user_id: ObjectId(GotProgress.user_id),
                pathway_id: GotProgress.pathway_id,
            },
            function(err, Prog) {
                if (Prog) {
                    console.log("here");
                    progress.collection.updateOne({ _id: ObjectId(Prog._id) }, {
                            $set: {
                                user_id: GotProgress.user_id,
                                pathway_id: GotProgress.pathway_id,
                                collection_id: GotProgress.collection_id,
                                resource_ids: GotProgress.resource_ids,
                                current_gp_id: GotProgress.current_gp_id,
                                current_resource_id: GotProgress.current_resource_id,
                                quizzes: GotProgress.quizzes,
                            },
                        },
                        async(err, res) => {
                            if (err) throw err;
                            console.log("progress has been updated");
                        }
                    );
                } else {
                    var UserProgress = new progress({
                        //  var UserProgress = {
                        user_id: GotProgress.user_id,
                        pathway_id: GotProgress.pathway_id,
                        collection_id: GotProgress.collection_id,
                        resource_ids: GotProgress.resource_ids,
                        current_gp_id: GotProgress.current_gp_id,
                        current_resource_id: GotProgress.current_resource_id,
                        quizzes: GotProgress.quizzes,
                    });

                    console.log(GotProgress);

                    //console.log(GotProgress.Coversation_id);

                    progress.collection.insertOne(UserProgress, async(err, res) => {
                        if (err) throw err;

                        console.log("1 document inserted");

                        //req.flash('success_msg', 'You are now registered and can login');
                        //res.redirect('login');
                        console.log(res);
                        await User.findByIdAndUpdate(GotProgress.user_id, {
                            $addToSet: { progress: res.insertedId },
                        });
                    });

                    //var user_id = req.user.id;
                    console.log(UserProgress.id);
                    //console.log(user.id);

                    // User.collection.updateOne(
                    //   { _id : ObjectId(GotProgress.user_id)},
                    //   {
                    //     $set : {"progress" : UserProgress.id}
                    //   },
                    //   function( err,res) {
                    //     if(err) throw err;
                    //       console.log('user has been updated with the progress');
                    // });
                }

                //console.log(user.progress);
            }
        );
        res.send({ data: 1 });
    }
);

module.exports = router;