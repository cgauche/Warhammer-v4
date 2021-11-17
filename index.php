<!DOCTYPE html>
<html>
<head>
    <base target="_top">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
    <?php require('Stylesheet.html') ?>
</head>
<body class='ui-widget'>
<div class="main_panel">
    <div class="header_panel"><span class="text"></span></div>
    <div class="body_panel">
        <div class="all_panel overflow_panel"></div>
        <div class="left_panel pretty_panel overflow_panel"></div>
        <div class="right_panel pretty_panel overflow_panel"></div>
        <div style="clear:both"></div>
    </div>
    <div class="footer_panel">
        <button style="display:none" class="ui-button ui-widget left_button button random">Random</button>
        <button style="display:none" class="ui-button ui-widget left_button button other"></button>
        <button style="display:none" class="ui-button ui-widget right_button button cancel">Annuler</button>
        <button style="display:none" class="ui-button ui-widget right_button button validate">OK</button>
    </div>
</div>
<div id="load" style='display:none' title="Charger votre personnage">
    <textarea style='width: 97%;' placeholder='Entrer le code de votre personnage ici' class='code'></textarea>
</div>
<div id="save" style='display:none' title="Code de votre personnage">
    <textarea style='width: 97%;' class='codesave'></textarea>
</div>
<?php require('StepSpecies.html') ?>
<?php require('StepCareers.html') ?>
<?php require('StepCharacteristics.html') ?>
<?php require('StepTalents.html') ?>
<?php require('StepSkills.html') ?>
<?php require('StepTrappings.html') ?>
<?php require('StepDetail.html') ?>
<?php require('StepExperience.html') ?>
<?php require('StepResume.html') ?>
<?php require('Glossaire.html') ?>
<?php require('MainMenu.html') ?>
<?php require('Menu.html') ?>
<?php require('Helper.html') ?>
<?php require('Character.html') ?>
<?php require('CharacterGenerator.html') ?>
<?php require('FoundryHelper.html') ?>
<div id="dialog" title=""></div>
<div id="dialog_modal" title=""></div>
<script>
    $(document).ready(function () {
        var CharGen = CharacterGenerator();
        Helper.initPopin();
        Helper.loader = new Helper.ajaxLoader("body");
    });
</script>
</body>
</html>