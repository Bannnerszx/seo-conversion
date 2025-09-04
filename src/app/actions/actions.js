'use server'
import { unstable_cache as cache } from "next/cache";
import moment from "moment";
import { db, admin, storage, auth } from "@/lib/firebaseAdmin";
import { FieldValue, FieldPath } from "firebase-admin/firestore";
import nodemailer from 'nodemailer';

////https://seo-conversion--real-motor-japan.asia-east1.hosted.app
// function setCorsHeaders(response) {
//     response.headers.set('Access-Control-Allow-Origin', '*');
//     response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//     response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
//     return response;
// };
// export async function OPTIONS() {
//     return setCorsHeaders(new NextResponse(null, { status: 204 }));
// };


export async function fetchInspectionPrice(inspectionName) {
    try {
        // Reference the "Inspection" collection and "inspectionPrice" document
        const inspectionDocRef = db.collection('Inspection').doc('inspectionPrice');
        const inspectionDoc = await inspectionDocRef.get();

        if (inspectionDoc.exists) {
            const data = inspectionDoc.data();
            const price = data[inspectionName];

            if (price !== undefined) {
                // Return the matched price as a float
                return parseFloat(price);
            } else {
                console.error(`Inspection name "${inspectionName}" not found`);
                return 0; // Default to 0 if the inspection name is not found
            }
        } else {
            console.error('Inspection document not found');
            return 0; // Default to 0 if the document is not found
        }
    } catch (error) {
        console.error('Error fetching inspection price:', error);
        return 0; // Default to 0 if there's an error
    }
}

export async function accountExist(userId) {
    // Return false if no userId is provided
    if (!userId) {
        return false;
    }

    try {
        const accountRef = db.collection('accounts').doc(userId);
        const docSnap = await accountRef.get();

        // The 'exists' property is a boolean indicating if the document was found
        return docSnap.exists;
    } catch (error) {
        console.error("Error checking if account exists:", error);
        // In case of an error, assume it doesn't exist or handle as needed
        return false;
    }
}
export async function checkChatExists(carId, userEmail) {
    try {
        if (!carId || !userEmail) {
            console.error("Missing carId or userEmail");
            return { error: "Missing carId or userEmail" };
        }

        // Generate chat document ID
        const chatId = `chat_${carId}_${userEmail}`;
        console.log("Generated chatId:", chatId);

        // Reference Firestore chat document
        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();

        if (chatDoc.exists) {
            console.log("Chat already exists for this inquiry");
            return { exists: true, message: "A chat already exists for this inquiry." };
        } else {
            console.log("No existing chat found for the given chatId");
            return { exists: false, message: "No chat exists for this inquiry." };
        }
    } catch (error) {
        console.error("Error while checking chat existence:", error);
        return { error: "Internal server error" };
    }
};

export async function addChatData({
    carId,
    userEmail,
    carData,
    formattedTime,
    inspectionPrice,
    recipientEmail,
    selectedCountry,
    selectedPort,
    chatFieldCurrency,
    inspectionIsRequired,
    inspectionName,
    toggle,
    insurance,
    currency,
    profitMap,
    freightOrigPrice,
    textInput,
    ip,
    ipCountry,
    ipCountryCode,
    addTransaction,
}) {
    try {



        // Validate required fields
        if (!carId || !userEmail || !carData || !formattedTime || !recipientEmail) {
            console.error("Missing required fields");
            throw new Error("Missing required fields");
        }

        const chatId = `chat_${carId}_${userEmail}`;
        const chatData = {
            lastMessageDate: formattedTime,
            read: false,
            readBy: [],
            lastMessage: textInput || 'You are now inquiring with this product.',
            lastMessageSender: userEmail,
            customerRead: true,
            participants: {
                salesRep: recipientEmail,
                customer: userEmail,
            },
            carData,
            stepIndicator: {
                value: 1,
                stepStatus: "Negotiation",
                sideBarNotification: false,
            },
            selectedCurrencyExchange: chatFieldCurrency,
            inspectionIsRequired,
            inspectionName,
            inspection: toggle,
            inspectionPrice,
            warranty: false,
            insurance,
            currency,
            freightPrice: profitMap,
            dateOfTransaction: formattedTime,
            country: selectedCountry,
            port: selectedPort,
            freightOrigPrice,
        };


        // Write chat data in the 'chats' collection
        const chatDocRef = db.collection('chats').doc(chatId);
        await chatDocRef.set(chatData, { merge: true });

        // Add the initial message in a 'messages' subcollection
        const newMessageDocRef = db
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .doc();
        const messageData = {
            sender: userEmail,
            text: textInput || 'You are now inquiring with this product.',
            timestamp: formattedTime,
            ip,
            ipCountry,
            ipCountryCode,
        };

        console.log("Message data to be added:", messageData);
        await newMessageDocRef.set(messageData);

        console.log("Updating user's transactions...");
        // Update the user's transactions in the 'accounts' collection
        const userTransactionsRef = db.collection('accounts').doc(userEmail);
        await userTransactionsRef.update({
            transactions: FieldValue.arrayUnion(addTransaction),
        });

        return "Chat data and message added successfully";
    } catch (error) {
        console.error("Error adding chat data and message:", error);
        throw new Error("Internal server error");
    }
};
export async function addOfferStatsCustomer({ docId, carData, userEmail, dayField }) {
    if (!docId || !userEmail || !carData || !dayField) {
        console.error("Missing required fields");
        throw new Error("Missing required fields");
    };
    const newData = {
        carName: carData?.carName || '',
        customerEmail: userEmail || '',
        imageURL:
            Array.isArray(carData?.images) && carData.images.length > 0
                ? carData.images[0]
                : '/placeholder.jpg',
        referenceNumber: carData?.referenceNumber || '',
        stockId: carData?.stockID || '',
    }

    const offerStatsRef = db.collection('OfferStats').doc(docId);

    await offerStatsRef.set({
        [dayField]: admin.firestore.FieldValue.arrayUnion(newData)
    }, { merge: true });

};

export async function processJackallSalesInfo({ chatId }) {
    const chatRef = db.collection('chats').doc(chatId);
    const countsRef = db.collection('counts').doc('jackall_ids');

    await db.runTransaction(async (transaction) => {
        // 1. Read the current counter
        const countsDoc = await transaction.get(countsRef);
        if (!countsDoc.exists) {
            throw new Error('Counter document does not exist!');
        }

        const currentId = countsDoc.get('sales-info-id');
        const newId = currentId + 1;

        // 2. Update the chat document atomically
        transaction.update(chatRef, { salesInfoId: newId });

        // 3. Upload external sales data
        const salesData = prepareSalesData(newId);
        await uploadJackallSalesInfoData(salesData);

        // 4. Bump the counter
        transaction.update(countsRef, { 'sales-info-id': currentId + 1 });
    });
}


export async function setOrderItem(chatId, selectedChatData, userEmail) {

    try {

        // Use node-fetch or a server-side compatible fetch method
        const [ipInfoResponse, tokyoTimeResponse] = await Promise.all([
            fetch('https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo', {
                headers: { 'Origin': 'https://seo-conversion--real-motor-japan.asia-east1.hosted.app' } // Removed trailing slash
            }),
            fetch('https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time', {
                headers: { 'Origin': 'https://seo-conversion--real-motor-japan.asia-east1.hosted.app' }
            })
        ]);


        // Check if responses are ok
        if (!ipInfoResponse.ok || !tokyoTimeResponse.ok) {
            throw new Error('Network response was not ok');
        }

        const [ipInfo, tokyoTime] = await Promise.all([
            ipInfoResponse.json(),
            tokyoTimeResponse.json()
        ]);

        // Format the time using moment
        const momentDate = moment(tokyoTime?.datetime, 'YYYY/MM/DD HH:mm:ss.SSS');
        const formattedTime = momentDate.format('YYYY/MM/DD [at] HH:mm:ss');

        // console.log(formattedTime, ipInfo);

        // return { formattedTime, ipInfo };
        const messageData = {
            sender: userEmail,
            text: "I agree with all the conditions and place the order.",
            timestamp: formattedTime,
            orderInvoiceIssue: true,
            setPaymentNotification: true,
            messageType: 'important',
            ip: ipInfo.ip,
            ipCountry: ipInfo.country_name,
            ipCountryCode: ipInfo.country_code
        };
        const messagesCollectionRef = db.collection('chats')
            .doc(chatId)
            .collection('messages');

        // Create a new document with an auto-generated ID
        await messagesCollectionRef.add(messageData);

        // invoice and vehicle
        const updateVehicleAndInvoice = {
            invoiceNumber: selectedChatData?.invoiceNumber || '',
            stockID: selectedChatData?.carData?.stockID || '',
            userEmail: userEmail
        };
        const invoiceRef = db.collection('IssuedInvoice').doc(selectedChatData?.invoiceNumber);
        const vehicleRef = db.collection('VehicleProducts').doc(selectedChatData?.carData?.stockID);
        // Update the 'IssuedInvoice' document
        await invoiceRef.update({
            orderPlaced: true,
        });

        // Update the 'VehicleProducts' document
        await vehicleRef.update({
            reservedTo: userEmail,
            stockStatus: 'Reserved',
        });
        // invoice and vehicle


        //messaage in chat data
        const updateMessageData = {
            lastMessage: 'I agree with all the conditions and place the order.',
            lastMessageDate: formattedTime,
            lastMessageSender: userEmail,
            read: false,
            readBy: []
        };

        await db
            .collection('chats')
            .doc(chatId)
            .update(updateMessageData);
        //message in chat data



        const docId = `${momentDate.format('YYYY')}-${momentDate.format('MM')}`;
        const dayField = momentDate.format('DD');

        const orderStatsData = {
            carName: selectedChatData?.carData?.carName || '',
            customerEmail: userEmail || '',
            imageUrl: selectedChatData?.carData?.images[0] || '',
            referenceNumber: selectedChatData?.carData?.referenceNumber || 'No Reference Number',
            stockId: selectedChatData?.carData?.stockID || 'No Stock ID',
        };
        const offerStatsRef = db.collection('OrderStats').doc(docId);
        await offerStatsRef.set({
            [dayField]: admin.firestore.FieldValue.arrayUnion(orderStatsData)
        }, { merge: true });

        //update status
        const update = {
            stepIndicator: {
                value: 3,
                status: 'Order Item',
            }
        };
        await db
            .collection('chats')
            .doc(chatId)
            .update(update);
        //update


    } catch (fetchError) {
        console.error("Error in API calls:", fetchError);
        // Properly handle and potentially rethrow the error
        throw new Error(`Failed to fetch data: ${fetchError.message}`);
    } finally {
        console.log("Firestore document updated successfully");
        return false;
    }
};



export async function loadMoreMessages(chatId, lastTimestamp) {
    if (!chatId) {
        throw new Error("Missing chatId");
    }

    const messagesRef = db.collection('chats').doc(chatId).collection('messages');

    // Convert lastTimestamp to a Firestore Timestamp.

    // Create a query that fetches messages after the given last timestamp.
    const messagesQuery = messagesRef
        .orderBy('timestamp', 'desc')
        .startAfter(lastTimestamp)
        .limit(15);

    const snapshot = await messagesQuery.get();
    const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: doc.data().timestamp ? doc.data().timestamp.toString() : null,
        };
    });

    return messages;
};

// export async function getCountries() {
//     // Get the document reference from the 'CustomerCountryPort' collection.
//     const docRef = db.collection('CustomerCountryPort').doc('CountryData');

//     // Await the document snapshot
//     const docSnapshot = await docRef.get();

//     // Check if the document exists
//     if (!docSnapshot.exists) {
//         throw new Error('Country data not found!');
//     }

//     // Extract the data from the document
//     const countryData = docSnapshot.data();

//     // Ensure the countries field exists in the document data
//     if (!countryData.countries) {
//         throw new Error('Countries field not found in the document!');
//     }

//     // Return the array of countries.
//     return countryData.countries;
// };

export const getCountries = cache(
    async () => {
        console.log('Cache MISS: Fetching country list from Firestore.');

        //Get the document reference from the 'CustomerCountryPort' collection.
        const docRef = db.collection('CustomerCountryPort')
            .doc('CountryData');

        //Await the document snapshot
        const docSnapshot = await docRef.get();

        //Check if the document exists
        if (!docSnapshot.exists) {
            console.error('Country data document not found!');
            return [];
        }

        //Extract the data from the document
        const countryData = docSnapshot.data();

        //Ensure the countries field exists in the document data
        if (!countryData || !countryData.countries) {
            console.error('Countries field not found in the document!');
            return [];
        }
        //Return the array of countries.
        return countryData.countries
    },
    {
        revalidate: 604800,
        tags: ['static-data', 'countries'],
    }
)


export async function getCities(countryCode) {
    if (!countryCode) {
        throw new Error("Country code is required to fetch cities.");
    }

    // Create a reference to the "CityChunks" subcollection,
    // order by document ID, and limit to 10 documents.
    const cityChunksRef = db
        .collection("cities")
        .doc(countryCode)
        .collection("CityChunks")
        .orderBy(FieldPath.documentId())
        .limit(10);

    try {
        const snapshot = await cityChunksRef.get();

        // For each document in the snapshot,
        // extract the array field 'cities' (if it exists) and map over to get the city names.
        const cityList = snapshot.docs.flatMap(doc => {
            const cities = doc.data().cities;
            return Array.isArray(cities) ? cities.map(city => city.name) : [];
        });

        return cityList;
    } catch (error) {
        console.error("Error fetching cities:", error);
        throw new Error("Failed to fetch cities.");
    }
};

export async function docDelivery(form1Data, chatId, userEmail) {
    const removeAccents = (str) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    Object.entries(form1Data).forEach(([key, value]) => {
        console.log(`Processing field: ${key}, Value: ${value}`);
        // You can add validation, formatting, or transformation logic here.
        // For instance, if you want to trim string values:
        if (typeof value === 'string') {
            form1Data[key] = value.trim();
        }
    });
    // Perform external fetch calls
    const [ipInfoResponse, tokyoTimeResponse] = await Promise.all([
        fetch('https://asia-northeast2-real-motor-japan.cloudfunctions.net/ipApi/ipInfo', {
            headers: { 'Origin': 'https://seo-conversion--real-motor-japan.asia-east1.hosted.app' }
        }),
        fetch('https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time', {
            headers: { 'Origin': 'https://seo-conversion--real-motor-japan.asia-east1.hosted.app' }
        })
    ]);

    if (!ipInfoResponse.ok || !tokyoTimeResponse.ok) {
        throw new Error('Network response was not ok');
    }

    const ipInfo = await ipInfoResponse.json();
    const tokyoTime = await tokyoTimeResponse.json();

    // Format the received Tokyo time using moment.js
    const momentDate = moment(tokyoTime?.datetime, 'YYYY/MM/DD HH:mm:ss.SSS');
    const formattedTime = momentDate.format('YYYY/MM/DD [at] HH:mm:ss');

    // Combine the form data passed from the client with the server-side fetched data.

    const messageText = `🌟 DOCUMENT DELIVERY ADDRESS 🌟
    🔍 Delivery Details:
    - Full Name: ${form1Data.fullName || 'N/A'}
    - Country: ${form1Data.country || 'N/A'}
    - City: ${form1Data.city || 'N/A'}
    - Address: ${form1Data.address || 'N/A'}
    - Fax Number: ${form1Data.faxNumber || 'N/A'}
    - Email: ${form1Data.email || 'N/A'}
    - Telephones: ${form1Data.telephoneNumber.length > 0 ? form1Data.telephoneNumber.join(', ') : 'No telephones provided'}

    Kind regards,
    ${form1Data.fullName || 'N/A'}`;

    const enrichedData = {
        ...form1Data,
        ip: ipInfo.ip,
        ipCountry: ipInfo.country_name,
        ipCountryCode: ipInfo.country_code,
        timeReceived: formattedTime,
        messageText
    };
    const chatRef = db.collection('chats').doc(chatId);

    await chatRef.update({
        docDelAdd: {
            deliveryInfo: {
                formData: {
                    fullName: form1Data.fullName,
                    country: removeAccents(form1Data.country),
                    city: removeAccents(form1Data.city),
                    address: form1Data.address,
                    faxNumber: form1Data.faxNumber || '',
                    email: form1Data.email,
                    telephones: form1Data.telephoneNumber,
                }
            }
        }
    });

    const messageData = {
        sender: userEmail,
        text: messageText,
        timestamp: formattedTime,
        messageType: 'important',
        ip: ipInfo.ip,
        ipCountry: ipInfo.country_name,
        ipCountryCode: ipInfo.country_code
    }
    const messagesCollectionRef = db.collection('chats').doc(chatId).collection('messages').doc();

    // Save the document with merge set to true
    await messagesCollectionRef.set(messageData, { merge: true });

    const fieldUpdate = db.collection('chats').doc(chatId);

    await fieldUpdate.update({
        lastMessage: messageText,
        lastMessageDate: formattedTime,
        lastMessageSender: userEmail,
        read: false,
        readBy: [],
    });

    // You may use this enriched data for further processing such as saving to a DB or sending an email.
    // console.log('Enriched Data:', form1Data.fullName || '');
    return true;
};

export async function updateCustomerFiles({ chatId, selectedFile, userEmail, messageValue, ipInfo, formattedTime }) {
    if (!userEmail) {
        throw new Error('The `userEmail` parameter is required for updateCustomerFiles.');
    }

    try {


        // 4. Prepare storage reference using the Firebase Admin SDK
        const bucket = storage.bucket('real-motor-japan.firebasestorage.app');
        const filePath = `ChatFiles/${chatId}/${selectedFile.name}`;
        const fileRef = bucket.file(filePath);

        // 5. Retrieve the file data from the client File object directly by converting it into a Buffer
        const arrayBuffer = await selectedFile.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // 6. Extract file extension (lowercase) and get IP details
        const fileNameParts = selectedFile.name.split('.');
        const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop().toLowerCase() : '';
        const ip = ipInfo.ip;
        const ipCountry = ipInfo.country_name;
        const ipCountryCode = ipInfo.country_code;

        // SECURITY CHECKPOINT: disallow SVG files
        if ((selectedFile.type && selectedFile.type === 'image/svg+xml') || fileExtension === 'svg') {
            throw new Error('SVG files are not allowed to be uploaded.');
        }

        // Whitelist allowed file extensions:
        const allowedExtensions = [
            'jpg', 'jpeg', 'png',   // images
            'pdf',                  // pdf
            'doc', 'docx',          // word documents
            'xls', 'xlsx',          // excel files
        ];
        if (!allowedExtensions.includes(fileExtension)) {
            throw new Error(`Uploading .${fileExtension} files is not allowed for security reasons.`);
        }

        // 6. Determine file type and default message text
        let fileType = '';
        let messageText = '';
        if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
            fileType = 'image';
            messageText = 'Sent an image';
        } else if (['pdf', 'xlsx', 'doc', 'docx', 'xls'].includes(fileExtension)) {
            fileType = 'attachment';
            messageText = 'Sent a link';
        } else {
            fileType = 'link';
            messageText = 'Sent a link';
        }

        // Debug log file size on server (using Buffer's byte length)
        console.log('File size:', fileBuffer.length);

        // 7. Upload the file to Firebase Storage using the Admin SDK
        await fileRef.save(fileBuffer, {
            metadata: {
                contentType: selectedFile.type || 'application/octet-stream',
            }
        });

        await fileRef.makePublic();


        // Generate a signed URL for the uploaded file valid for 24 hours.
        const downloadURL = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        // 8. Create a new message document in Firestore using the Admin SDK
        const messagesCollectionRef = db.collection('chats').doc(chatId).collection('messages');
        const newMessageDocRef = messagesCollectionRef.doc();
        const messageData = {
            sender: userEmail,
            text: messageValue,
            timestamp: formattedTime,
            file: {
                url: downloadURL,
                type: fileType,
                name: selectedFile.name,
            },
            ip: ip,
            ipCountry: ipCountry,
            ipCountryCode: ipCountryCode,
        };

        await newMessageDocRef.set(messageData);

        // 9. Update the "chats" collection to reflect the new message
        const chatDocRef = db.collection('chats').doc(chatId);
        await chatDocRef.update({
            lastMessage: messageValue || messageText,
            lastMessageDate: formattedTime,
            lastMessageSender: userEmail,
            read: false,
            readBy: [],
        });

        return { success: true, downloadURL };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};


export async function updatePaymentNotifications({ nameOfRemitter, calendarETD, chatId, selectedFile, userEmail, messageValue, ipInfo, formattedTime }) {
    try {

        // 4. Prepare storage reference using the Firebase Admin SDK
        const bucket = storage.bucket('real-motor-japan.firebasestorage.app');
        const filePath = `ChatFiles/${chatId}/${selectedFile.name}`;
        const fileRef = bucket.file(filePath);

        // 5. Retrieve the file data from the client File object directly by converting it into a Buffer
        const arrayBuffer = await selectedFile.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // 6. Extract file extension (lowercase) and get IP details
        const fileNameParts = selectedFile.name.split('.');
        const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop().toLowerCase() : '';
        const ip = ipInfo.ip;
        const ipCountry = ipInfo.country_name;
        const ipCountryCode = ipInfo.country_code;

        // SECURITY CHECKPOINT: disallow SVG files
        if ((selectedFile.type && selectedFile.type === 'image/svg+xml') || fileExtension === 'svg') {
            throw new Error('SVG files are not allowed to be uploaded.');
        }

        // Whitelist allowed file extensions:
        const allowedExtensions = [
            'jpg', 'jpeg', 'png',   // images
            'pdf',                  // pdf
            'doc', 'docx',          // word documents
            'xls', 'xlsx',          // excel files
        ];
        if (!allowedExtensions.includes(fileExtension)) {
            throw new Error(`Uploading .${fileExtension} files is not allowed for security reasons.`);
        }

        // 6. Determine file type and default message text
        let fileType = '';
        let messageText = '';
        if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
            fileType = 'image';
            messageText = 'Sent an image';
        } else if (['pdf', 'xlsx', 'doc', 'docx', 'xls'].includes(fileExtension)) {
            fileType = 'attachment';
            messageText = 'Sent a link';
        } else {
            fileType = 'link';
            messageText = 'Sent a link';
        }

        // Debug log file size on server (using Buffer's byte length)
        console.log('File size:', fileBuffer.length);

        // 7. Upload the file to Firebase Storage using the Admin SDK
        await fileRef.save(fileBuffer, {
            metadata: {
                contentType: selectedFile.type || 'application/octet-stream',
            }
        });

        await fileRef.makePublic();

        // Generate a signed URL for the uploaded file valid for 24 hours.
        const downloadURL = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        // 8. Create a new message document in Firestore using the Admin SDK
        const messagesCollectionRef = db.collection('chats').doc(chatId).collection('messages');
        const newMessageDocRef = messagesCollectionRef.doc();
        const messageData = {
            sender: userEmail,
            text: messageValue,
            timestamp: formattedTime,
            file: {
                url: downloadURL,
                type: fileType,
                name: selectedFile.name,
            },
            ip: ip,
            ipCountry: ipCountry,
            ipCountryCode: ipCountryCode,
        };

        await newMessageDocRef.set(messageData);

        // 9. Update the "chats" collection to reflect the new message
        const chatDocRef = db.collection('chats').doc(chatId);
        await chatDocRef.update({
            lastMessage: messageValue || messageText,
            lastMessageDate: formattedTime,
            lastMessageSender: userEmail,
            read: false,
            readBy: [],
            paymentNotification: {
                uploadPaymentDate: calendarETD,
                nameOfRemitter: nameOfRemitter,
                fileName: selectedFile.name,
                url: downloadURL
            }
        });

        return { success: true, downloadURL };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }

};

export async function updateInvoice(form1Data, form2Data, chatId, userEmail, isChecked, sameAsConsignee, ipInfo, formattedTime) {
    const removeAccents = (str) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    Object.entries(form1Data).forEach(([key, value]) => {
        console.log(`Processing field: ${key}, Value: ${value}`);
        // You can add validation, formatting, or transformation logic here.
        // For instance, if you want to trim string values:
        if (typeof value === 'string') {
            form1Data[key] = value.trim();
        }
    });

    Object.entries(form2Data).forEach(([key, value]) => {
        console.log(`Processing field: ${key}, Value: ${value}`);
        // You can add validation, formatting, or transformation logic here.
        // For instance, if you want to trim string values:
        if (typeof value === 'string') {
            form2Data[key] = value.trim();
        }
    });

    // Combine the form data passed from the client with the server-side fetched data.

    const messageText = `Request for Invoice Amendment`;

    const enrichedData = {
        ...form1Data,
        ...form2Data,
        ip: ipInfo.ip,
        ipCountry: ipInfo.country_name,
        ipCountryCode: ipInfo.country_code,
        timeReceived: formattedTime,
        messageText
    };
    const chatRef = db.collection('chats').doc(chatId);

    await chatRef.update({
        requestAmendment: true,
        invoiceAmendment: {
            consignee: {
                fullName: form1Data.fullName,
                country: removeAccents(form1Data.country),
                city: removeAccents(form1Data.city),
                address: form1Data.address,
                fax: form1Data.faxNumber || '',
                email: form1Data.email,
                telephones: form1Data.telephoneNumber,
                sameAsBuyer: isChecked //kindly make a check button at client side
            },
            notifyParty: {
                fullName: form2Data.fullName,
                country: removeAccents(form2Data.country),
                city: removeAccents(form2Data.city),
                address: form2Data.address,
                fax: form2Data.faxNumber || '',
                email: form2Data.email,
                telephones: form2Data.telephoneNumber,
                sameAsConsignee: sameAsConsignee //kindly make a check button at client side
            }
        }
    });

    const messageData = {
        sender: userEmail,
        text: 'Request for Invoice Amendment',
        timestamp: formattedTime,
        messageType: 'InvoiceAmendment',
        ip: ipInfo.ip,
        ipCountry: ipInfo.country_name,
        ipCountryCode: ipInfo.country_code
    }
    const messagesCollectionRef = db.collection('chats').doc(chatId).collection('messages').doc();

    // Save the document with merge set to true
    await messagesCollectionRef.set(messageData, { merge: true });

    const fieldUpdate = db.collection('chats').doc(chatId);

    await fieldUpdate.update({
        lastMessage: 'Request for Invoice Amendment',
        lastMessageDate: formattedTime,
        lastMessageSender: userEmail,
        read: false,
        readBy: [],
    });

    // You may use this enriched data for further processing such as saving to a DB or sending an email.
    // console.log('Enriched Data:', form1Data.fullName || '');
    return true;
};


export async function getBookingData(invoiceNumber, userEmail) {
    try {
        // build your query
        const bookingQuery = db
            .collection('booking')
            .where('invoiceNumber', '==', invoiceNumber)
            .where('customerEmail', '==', userEmail)

        // run it
        const snapshot = await bookingQuery.get()

        if (snapshot.empty) {
            console.log('No document found matching both invoice number and user email.')
            return []  // or return null, up to your API design
        }

        // collect the results
        const bookings = []
        snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() })
        })

        return bookings
    } catch (error) {
        console.error('Error fetching booking data:', error)
        throw error
    }
};

export async function checkUserExist(userEmail) {
    if (!userEmail) {
        throw new Error('Missing required argument: userEmail');
    }

    const requiredFields = [
        'country',
        'city',
        'textEmail',
        'textFirst',
        'textLast',
        'textPhoneNumber',
        'textStreet'
    ];

    const docRef = db.collection('accounts').doc(userEmail);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
        // No document → brand‑new user: all fields are missing
        return {
            exists: false,
            missingFields: requiredFields,
            migrated: false,
            passwordResetSent: false
        };
    }

    const data = snapshot.data();
    const missingFields = requiredFields.filter(field => {
        const v = data[field];
        return v == null || (typeof v === 'string' && v.trim() === '');
    });

    if (missingFields.length > 0) {
        // Document exists but profile incomplete
        return {
            exists: false,
            missingFields,
            migrated: !!data.migrated,
            passwordResetSent: !!data.passwordResetSent
        };
    }

    // All required fields present
    return {
        exists: true,
        missingFields: [],
        migrated: !!data.migrated,
        passwordResetSent: !!data.passwordResetSent
    };
};


export async function getAccountData(userEmail) {
    if (!userEmail) {
        throw new Error("Missing required argument: userEmail");
    }

    const docRef = db.collection("accounts").doc(userEmail);
    const snapshot = await docRef.get();

    // If no document, return null
    if (!snapshot.exists) {
        return null;
    }

    // Otherwise return the raw data object
    return snapshot.data();
};

export async function getOldId(userEmail) {
    if (!userEmail) {
        throw new Error("getOldId: userEmail is required");
    }

    // Reference to /accounts/{userEmail}
    const docRef = db.collection("accounts").doc(userEmail);

    try {
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            // no document for that email
            return null;
        }

        // pull out the client_id field
        const data = snapshot.data();
        return data.client_id ?? null;

    } catch (err) {
        console.error("getOldId: Firestore read failed:", err);
        throw err;
    }
};

export async function getCurrentFtpId() {
    const docRef = db.collection("counts").doc("jackall_ids");

    try {
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            throw new Error("Counts document does not exist!");
        }

        const data = snapshot.data();
        // you can adjust the key here if it ever changes
        return data["account-ftp-id"];
    } catch (err) {
        console.error("getCurrentFtpId error:", err);
        throw err;
    }
};

export async function fetchServerTime() {
    try {
        const [tokyoTimeResponse] = await Promise.all([
            fetch('https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time', {
                headers: { 'Origin': 'https://seo-conversion--real-motor-japan.asia-east1.hosted.app' }
            })
        ]);
        const tokyoTime = await tokyoTimeResponse.json();

        // data.datetime is expected in "YYYY/MM/DD HH:mm:ss.SSS"
        const momentDate = moment(tokyoTime.datetime, "YYYY/MM/DD HH:mm:ss.SSS");
        return momentDate.format("MMMM D, YYYY [at] h:mm:ss A [UTC]Z");
    } catch (err) {
        console.error("fetchServerTime error:", err);
        throw err;
    }
}


export async function submitJackallClient({
    userEmail,
    newClientId,
    firstName,
    lastName,
    zip,
    street,
    city,
    phoneNumber,
    countryName,
    note = "",
}) {
    if (!userEmail) {
        throw new Error("submitJackallClient: userEmail is required");
    }

    // 1) build your single source-of-truth object
    const jackallClientData = {
        id: newClientId,
        client_name: `${firstName} ${lastName}`,
        address: `${zip} ${street} ${city}`,
        phone: phoneNumber,
        email: userEmail,
        country_name: countryName,
        note,
    };

    // 2) send it to your Cloud Function
    const response = await fetch(
        "https://asia-northeast2-real-motor-japan.cloudfunctions.net/uploadJackallClients",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // wrap it in an array if your function expects an array of clients
            body: JSON.stringify([jackallClientData]),
        }
    );
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`uploadJackallClients failed: ${text}`);
    }

    // 3) write the same object to Firestore
    //   const docRef = db
    //     .collection("jackallClients")
    //     .doc(String(newClientId));
    //   await docRef.set(jackallClientData);

    return { success: true };
}


export async function submitUserData({
    userEmail,
    city,
    country,
    textFirst,
    textLast,
    textPhoneNumber,
    textStreet,
    textZip,
    dateOfCreation,
    client_id,
    currentId,
    keywords = [],
}) {
    // 1. Validate required fields
    if (
        !userEmail ||
        !city ||
        !country ||
        !textFirst ||
        !textLast ||
        !textPhoneNumber ||
        !textStreet ||
        !textZip ||
        !dateOfCreation ||
        client_id == null ||
        currentId == null
    ) {
        throw new Error("submitUserData: Missing required fields.");
    }

    // 2. Get doc refs
    const countsDocRef = db.collection("counts").doc("jackall_ids");
    const userDocRef = db.collection("accounts").doc(userEmail);

    // 3. Run transaction
    await db.runTransaction(async (transaction) => {
        // a) increment the FTP counter
        transaction.update(countsDocRef, {
            "account-ftp-id": FieldValue.increment(1),
        });

        // b) write (or merge) the user’s account data
        transaction.set(
            userDocRef,
            {
                client_id,
                city,
                country,
                textFirst,
                textLast,
                textPhoneNumber,
                textStreet,
                textZip,
                textEmail: userEmail,
                dateOfCreation,
                keywords,
            },
            { merge: true }

        );

    });
    return { success: true };
}
export async function handleSignUp(userEmail, userPassword) {
    try {
        const userRecord = await auth.createUser({
            email: userEmail,
            password: userPassword
        });
        console.log('User created:', userRecord.uid);
        return {
            success: true,
            uid: userRecord.uid
        };
    } catch (error) {
        console.error('handleSignUp error:', error);
        return {
            success: false,
            code: error.code ?? 'UNKNOWN_ERROR',
            message: error.message ?? String(error)
        };
    }
}

export async function makeFavorite({ product, userEmail }) {
    const [tokyoTimeResponse] = await Promise.all([
        fetch('https://asia-northeast2-real-motor-japan.cloudfunctions.net/serverSideTimeAPI/get-tokyo-time', {
            headers: { 'Origin': 'https://seo-conversion--real-motor-japan.asia-east1.hosted.app' }
        })
    ]);

    if (!tokyoTimeResponse.ok) {
        throw new Error('Network response was not ok');
    }

    const tokyoTime = await tokyoTimeResponse.json();
    const momentDate = moment(tokyoTime?.datetime, 'YYYY/MM/DD HH:mm:ss.SSS');

    const year = momentDate.format('YYYY');
    const month = momentDate.format('MM');
    const day = momentDate.format('DD');
    const time = momentDate.format('HH:mm:ss');

    const dateOfTransaction = `${year}/${month}/${day} at ${time}`;

    const newFavorite = {
        carName: product.carName,
        imageUrl: product?.images?.[0] ?? '/placeholder.png',
        referenceNumber: product.referenceNumber,
        stockId: product.stockID,
        fobPrice: product.fobPrice,
        regYear: product.regYear ?? '',
        regMonth: product.regMonth ?? '',   // ← default to empty string
        mileage: product.mileage ?? 0,
        steering: product.steering ?? '',
        color: product.exteriorColor ?? '',
        dateOfTransaction
    };

    const userDocRef = db.collection('accounts').doc(userEmail);
    const userSnap = await userDocRef.get();

    if (userSnap.exists) {
        const userData = userSnap.data();
        const currentFavorites = userData.favorites || [];

        const isAlreadyInFavorites = currentFavorites.some(fav => fav.stockId === product.stockID);
        if (isAlreadyInFavorites) {
            console.log('This car is already in the favorites list.');
            return;
        }

        await userDocRef.update({
            favorites: admin.firestore.FieldValue.arrayUnion(newFavorite),
        });

        console.log('Car successfully added to favorites.');
    } else {
        console.log('User document does not exist.');
    }
};

export async function isFavorited({ userEmail }) {
    try {
        const userRef = db.collection('accounts').doc(userEmail);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return false;
        }

        const userData = userSnap.data();
        const favorites = userData.favorites || [];
        const updatedFavoritesState = {};
        favorites.forEach((fav) => {
            updatedFavoritesState[fav.stockId] = true; // Mark as favorited
        });
        return updatedFavoritesState;
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
}
export async function removeFavorite({ stockId, userEmail }) {
    // 1. Grab the user’s doc
    const userDocRef = db.collection("accounts").doc(userEmail)
    const userSnap = await userDocRef.get()

    if (!userSnap.exists) {
        console.log("User document does not exist.")
        return
    }

    // 2. Find the exact favorite object in their array
    const userData = userSnap.data()
    const currentFavorites = userData.favorites || []
    const favToRemove = currentFavorites.find(fav => fav.stockId === stockId)

    if (!favToRemove) {
        console.log("This car isn’t in the favorites list.")
        return
    }

    // 3. Tell Firestore to remove that object
    await userDocRef.update({
        favorites: admin.firestore.FieldValue.arrayRemove(favToRemove),
    })

    console.log("Car successfully removed from favorites.")
};


export async function fetchFavoriteStockIds({ userEmail }) {
    const userDocRef = db.collection("accounts").doc(userEmail);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
        console.log("User document does not exist.");
        return [];
    }

    const userData = userSnap.data();
    const currentFavorites = userData.favorites || [];

    // Assuming each favorite is an object with a `stockId` field
    const stockIds = currentFavorites.map(fav => fav.stockId);
    return stockIds;
};

export async function getDataFromStockId({ stockId }) {
    const vehicleDocRef = db.collection("VehicleProducts").doc(stockId);
    const vehicleSnap = await vehicleDocRef.get();

    if (!vehicleSnap.exists) {
        console.log(`Vehicle with stockId ${stockId} does not exist.`);
        return null;
    }

    return vehicleSnap.data();
};

export async function editUserData({
    userEmail,
    city,
    country,
    textFirst,
    textLast,
    textPhoneNumber,
    textStreet,
    textZip,
}) {
    // 1. Validate required fields
    if (
        !userEmail ||
        !city ||
        !country ||
        !textFirst ||
        !textLast ||
        !textPhoneNumber ||
        !textStreet ||
        !textZip
    ) {
        throw new Error("editUserData: Missing required fields.");
    }

    // 2. Reference to the user's document
    const userDocRef = db.collection("accounts").doc(userEmail);

    // 3. Run transaction to merge new data
    await db.runTransaction(async (transaction) => {
        transaction.set(
            userDocRef,
            {

                city,
                country,
                textFirst,
                textLast,
                textPhoneNumber,
                textStreet,
                textZip,
                textEmail: userEmail,

            },
            { merge: true }
        );
    });

    return { success: true };
};



export async function fetchNotificationCounts({ userEmail }) {
    const snapshot = await db
        .collection("chats")
        .where("participants.customer", "==", userEmail)
        .where("customerRead", "==", false)
        .get()

    return snapshot.size // Number of unread chats
};




export async function fetchInvoiceData({ invoiceNumber }) {
    try {
        // Get the invoice document reference
        const invoiceSnapshot = await db.collection("IssuedInvoice").doc(invoiceNumber).get();

        // Check if the document exists
        if (!invoiceSnapshot.exists) {
            throw new Error(`Invoice ${invoiceNumber} not found`);
        }

        // Get the data from the document
        const invoiceData = invoiceSnapshot.data();

        return invoiceData;
    } catch (error) {
        console.error("Error fetching invoice data:", error);
        throw error;
    }
};

export async function fetchBookingData({ userEmail, invoiceNumber }) {
    try {
        const bookingSnapshot = await db
            .collection('booking')
            .where("invoiceNumber", "==", invoiceNumber)
            .where("customerEmail", "==", userEmail)
            .get();

        if (bookingSnapshot.empty) {
            throw new Error(`Booking for invoice ${invoiceNumber} not found`);
        }

        // Grab the first matching document:
        const doc = bookingSnapshot.docs[0];
        const bookingData = { id: doc.id, ...doc.data() };

        return bookingData;
    } catch (error) {
        console.error("Error fetching booking data:", error);
        throw error;
    }
};

export const getMakeCounts = async (maker) => {
    try {
        const snapshot = await db.collection('VehicleProducts')
            .where('stockStatus', '==', 'On-Sale')
            .where('imageCount', '>', 0)
            .where("make", "==", maker)
            .count()
            .get();

        return snapshot.data()?.count ?? 0;

    } catch (error) {
        console.error('Error fetching document count:', error);
        return 0; // Return null instead of 0 to indicate an error
    }
};
let _cached = {
    token:     /** @type {string|null} */ null,
    expiresAt: /** @type {number}    */ 0  // UNIX secs
}
export async function getAppCheckToken({ appId }) {
    const nowSec = Math.floor(Date.now() / 1000)

    // 1) if we still have >60s of validity left, reuse the cached token
    if (_cached.token && _cached.expiresAt - nowSec > 60) {
        return {
            appCheckToken: _cached.token,
            expiresAt: _cached.expiresAt
        }
    }

    // 2) otherwise mint a fresh 24 h token
    const { token, ttl } = await admin
        .appCheck()
        .createToken(appId, { ttl: 86400 })  // 24 h in seconds

    const expiresAt = nowSec + (ttl ?? 3600)  // fallback to 1h if ttl missing

    // 3) stash it in our module cache
    _cached = { token, expiresAt }

    return {
        appCheckToken: token,
        expiresAt
    }
}

export async function emailUs({ userName, userEmail, subject, message }) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Real Motor Japan - Contact Form Submission</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;line-height:1.6;color:#333;background-color:#f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="padding:20px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" align="center"
               style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 0 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#0000ff;padding:20px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">REAL MOTOR JAPAN</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <h2 style="color:#0000ff;margin-top:0;">New Contact Form Submission</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="margin-bottom:20px;">
                <tr>
                  <td style="padding:10px;background-color:#f9f9f9;border-left:4px solid #0000ff;">
                    <p style="margin:0;"><strong style="color:#0000ff;">From:</strong> ${userName} &lt;${userEmail}&gt;</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px;background-color:#f9f9f9;border-left:4px solid #0000ff;margin-top:5px;">
                    <p style="margin:0;"><strong style="color:#0000ff;">Subject:</strong> ${subject}</p>
                  </td>
                </tr>
              </table>
              <div style="padding:20px;background-color:#f9f9f9;border-radius:4px;border-left:4px solid #0000ff;">
                <h3 style="color:#0000ff;margin-top:0;">Message:</h3>
                <div>${message.replace(/\n/g, '<br/>')}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f0f0f0;padding:20px;text-align:center;border-top:3px solid #0000ff;">
              <p style="margin:0;font-size:14px;color:#666;">&copy; 2024 Real Motor Japan. All rights reserved.</p>
              <p style="margin:10px 0 0;font-size:12px;color:#888;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>
        </table>    
      </td>
    </tr>
  </table>
</body>
</html>`;
    // 1️⃣ Create the transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'info@realmotor.jp',
            pass: 'owua fjqc yjro budr',
        },
    });

    // 2️⃣ Build the mail options
    const info = await transporter.sendMail({
        from: `"${userName}" <${userEmail}>`,
        to: 'info@realmotor.jp',
        replyTo: `${userEmail}`,      // e.g. info@realmotor.jp
        subject,
        text: `From: ${userName} <${userEmail}>\n\n${message}`,
        html,
    });

    console.log('Email sent');
    return { success: true, messageId: info.messageId }
};

