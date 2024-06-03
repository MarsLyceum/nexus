import { StyleSheet } from 'react-native';

export const formStyles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },
    container: {
        width: '50%',
    },
    slickWrapper: {},
    buttonContainerSmall: {
        display: 'flex',
        marginTop: 5,
        marginBottom: 5,
    },
    textInputContainer: {
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderRadius: 4,
        padding: 4,
        backgroundColor: '#f7fbff',
        width: '100%',
    },
    fullWidth: {
        width: '100%',
    },
    inlineView: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    btnContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        alignSelf: 'stretch',
        borderRadius: 10,
    },
    btnClickContain: {
        // flex: 1,
        // flexDirection: "row",
        // justifyContent: "center",
        // alignItems: "stretch",
        // alignSelf: "stretch",
        backgroundColor: '#f3f9fa',
        borderRadius: 5,
        padding: 5,
        marginTop: 5,
        marginBottom: 5,
        height: 30,
    },
    headerTitle: {
        fontSize: 24,
    },
    wordCloudContainer: {
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderRadius: 4,
        padding: 4,
        backgroundColor: '#f7fbff',
        width: '100%',
        minHeight: 60,
    },
    imageSelector: {
        width: '100%',
    },
    selectedImage: {
        width: '50%',
    },
    buttonContainer: {
        width: '75%',
        marginHorizontal: 'auto',
        marginTop: 20,
    },
});
