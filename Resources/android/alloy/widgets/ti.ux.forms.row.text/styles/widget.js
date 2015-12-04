function WPATH(s) {
    var index = s.lastIndexOf("/");
    var path = -1 === index ? "ti.ux.forms.row.text/" + s : s.substring(0, index) + "/ti.ux.forms.row.text/" + s.substring(index + 1);
    return true && 0 !== path.indexOf("/") ? "/" + path : path;
}

module.exports = [ {
    isApi: true,
    priority: 1101.0028,
    key: "TextField",
    style: {
        hintTextColor: "#89896C"
    }
} ];