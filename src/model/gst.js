const mongoose = require('mongoose');
const gstSchema= new mongoose.Schema({
    excelFile:{
        type:String

    },
    SourceName:{
        type:String
    },
    SupplierGSTIN:{
        type:String
    },
    SupplierLegalName:{
        type:String
    },
    SupplierTradeName:{
        type:String
    },
    invoiceDate:{
        type:String
    },
    booksDate:{
        type:String
    },
    invoiceNumber:{
        type:String
    },
    TotalTaxableValue:{
        type:Number
    },
    TotalTaxValue:{
        type:Number
    },
    TotalIGSTAmount:{
        type:Number
    },
    TotalCGSTAmount:{
        type:Number
    },
    TotalSGSTAmount:{
        type:Number
    },
    TotalInvoiceValue:{
        type:String
    },
    GSTR2ABooksSource:{
        type:String
    },
    section:{
        type:String
    },
    ReturnFiled:{
        type:String
    },
    FilingYear:{
        type:String
    },
    FilingMonth:{
        type:String
    },
    FilingDate:{
        type:String
    },
    GSTR3BReturnStatus:{
        type:Boolean
    },
    EffCancellationDate:{
        type:String
    }
})


const gst = mongoose.model('gst', gstSchema);

module.exports={
    gst
}
