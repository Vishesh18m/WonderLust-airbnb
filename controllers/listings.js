const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.formForNewListing = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({path:"reviews",populate:{path:"author"}})
    .populate("owner");

    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    let url = req.file.path ;
    let filename = req.file.filename ;
    
    const newList = new Listing(req.body.listing);
    newList.owner = req.user._id;
    newList.image = {url,filename};

    // const location = req.body.listing.location;
    // const response = await fetch(
    //     `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`,
    
    //     {
    //         headers: {
    //         "User-Agent": "your-app-name (your-email@example.com)"
    //         }
    //     }
    // );

    // const coordinates = await response.json();
    // const latitude = coordinates[0].lat ;
    // const longitude = coordinates[0].lon ;

    // newList.geometry = {
    // type: "Point",
    // coordinates: [longitude, latitude]   // ⚠️ GeoJSON = [longitude, latitude]
    // };
    
    // Save listing
    await newList.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested does not exist!");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/h_200,w_250");
    res.render("listings/edit.ejs", { listing , originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    
    if(typeof req.file !== "undefined"){
        let url = req.file.path ;
        let filename = req.file.filename ;
        listing.image = {url,filename};
        await listing.save();
    }
    
    req.flash("success","Listing Updated!")
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deleted = await Listing.findByIdAndDelete(id);
    console.log(deleted);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};